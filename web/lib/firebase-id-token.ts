import { getAuth } from "firebase-admin/auth";

import { getFirebaseAdminApp } from "@/lib/firebase-admin";

export interface VerifiedFirebaseUser {
  uid: string;
  email: string | undefined;
}

export async function verifyFirebaseIdToken(
  bearerToken: string | null,
): Promise<VerifiedFirebaseUser | null> {
  if (!bearerToken?.trim()) {
    return null;
  }
  try {
    const decoded = await getAuth(getFirebaseAdminApp()).verifyIdToken(
      bearerToken.trim(),
    );
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return h.slice(7).trim() || null;
}
