"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Tag,
  FileText,
  Users,
  Mail,
  Settings,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/pricing", label: "Pricing plans", icon: Tag },
  { href: "/dashboard/content", label: "Site content", icon: FileText },
  { href: "/dashboard/waitlist", label: "Waitlist", icon: Users },
  { href: "/dashboard/contacts", label: "Contacts", icon: Mail },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 md:block">
      <div className="flex h-full flex-col p-4">
        <p className="px-2 text-sm font-bold text-stone-900 dark:text-stone-50">Pawfect</p>
        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-primary/15 text-primary-dark dark:text-primary"
                    : "text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
