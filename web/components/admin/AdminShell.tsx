"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import { adminNavLabelForPath } from "@/components/admin/adminNavLinks";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";

export function AdminShell({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = adminNavLabelForPath(pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <aside className="hidden w-56 shrink-0 border-r border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 md:flex md:flex-col">
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between gap-2 px-2">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-50">Pawfect</p>
            <AdminThemeToggle />
          </div>
          <p className="mt-1 px-2 text-xs text-stone-500 dark:text-stone-400">Admin panel</p>
          <div className="mt-6 flex flex-1 flex-col">
            <AdminNav />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/95 md:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-50">Pawfect</p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">{pageTitle}</p>
          </div>
          <AdminThemeToggle />
        </header>

        {menuOpen ? (
          <div
            className="fixed inset-0 z-50 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <button
              type="button"
              className="absolute inset-0 bg-stone-900/60 dark:bg-black/70"
              aria-label="Close navigation menu"
              onClick={() => setMenuOpen(false)}
            />
            <aside className="relative flex h-full w-[min(100%,18rem)] flex-col border-r border-stone-200 bg-white shadow-xl dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
                <div>
                  <p className="text-sm font-bold text-stone-900 dark:text-stone-50">Pawfect</p>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Admin panel</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto p-4">
                <AdminNav onNavigate={() => setMenuOpen(false)} />
              </div>
            </aside>
          </div>
        ) : null}

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
