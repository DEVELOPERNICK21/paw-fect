"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { adminNavLinks, isAdminNavActive } from "@/components/admin/adminNavLinks";

export function AdminNav({
  onNavigate,
}: {
  onNavigate?: () => void;
}): React.ReactElement {
  const pathname = usePathname();

  return (
    <>
      <nav className="flex flex-1 flex-col gap-1">
        {adminNavLinks.map(link => {
          const active = isAdminNavActive(pathname, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/15 text-primary-dark dark:bg-primary/20 dark:text-primary"
                  : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          void signOut({ callbackUrl: "/" });
        }}
        className="mt-4 rounded-lg px-3 py-2.5 text-left text-sm text-stone-500 transition-colors hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800"
      >
        Sign out
      </button>
    </>
  );
}
