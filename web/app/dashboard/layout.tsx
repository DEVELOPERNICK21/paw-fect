import { AdminShell } from "@/components/admin/AdminShell";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return <AdminShell>{children}</AdminShell>;
}
