import crypto from "crypto";

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function signedJwt(opts: {
  clientEmail: string;
  privateKey: string;
  scope: string;
}): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = toBase64Url(
    JSON.stringify({
      iss: opts.clientEmail,
      scope: opts.scope,
      aud: "https://oauth2.googleapis.com/token",
      iat,
      exp,
    }),
  );
  const body = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(body);
  signer.end();
  const signature = toBase64Url(signer.sign(opts.privateKey));
  return `${body}.${signature}`;
}

export async function getGooglePlayAccessToken(): Promise<string> {
  const clientEmail = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL?.trim();
  const privateKeyRaw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) {
    throw new Error(
      "Missing GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL or GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY",
    );
  }
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const assertion = signedJwt({
    clientEmail,
    privateKey,
    scope: "https://www.googleapis.com/auth/androidpublisher",
  });

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error ?? "Failed to obtain Google access token");
  }
  return json.access_token;
}
