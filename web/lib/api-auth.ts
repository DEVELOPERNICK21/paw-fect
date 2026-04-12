import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function requireAdminSession(): Promise<
  { ok: true } | { ok: false; response: Response }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { ok: true };
}
