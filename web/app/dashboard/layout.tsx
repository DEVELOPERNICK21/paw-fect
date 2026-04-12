import { AdminSidebar } from "@/components/admin/AdminSidebar";
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

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-6 lg:p-10">{children}</div>
    </div>
  );
}
