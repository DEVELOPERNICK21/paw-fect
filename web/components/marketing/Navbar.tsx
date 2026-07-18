"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Dog, Cat } from "lucide-react";
import { ThemeToggle } from "@/components/marketing/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/waitlist", label: "Waitlist" },
  { href: "/contact", label: "Contact" },
];

export function Navbar(): React.ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-background/85 backdrop-blur-xl dark:border-stone-700/80">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        aria-label="Main"
      >
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-lg font-bold tracking-tight text-stone-900 dark:text-stone-50"
        >
          <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-accent/15 ring-1 ring-primary/25 transition group-hover:scale-105 group-hover:shadow-brand group-hover:ring-primary/40">
            <Dog className="h-6 w-6 text-primary" aria-hidden />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-stone-200 dark:bg-stone-800 dark:ring-stone-600">
              <Cat className="h-3 w-3 text-accent" aria-hidden />
            </span>
          </span>
          <span className="text-gradient-brand">Pawfect</span>
        </Link>
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="rounded-full p-2 text-stone-700 transition hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-stone-800"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        <ul className="hidden gap-1 md:flex md:items-center">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="nav-link-underline px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/download"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-brand transition hover:bg-primary-dark hover:brightness-105 active:scale-[0.98] dark:text-stone-900"
          >
            Get the app
          </Link>
        </div>
      </nav>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-stone-200 bg-cream dark:border-stone-700 dark:bg-stone-900 md:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 py-4">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block rounded-xl px-3 py-3 font-medium text-stone-800 transition hover:bg-primary/10 dark:text-stone-100"
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/download"
                  className="mt-2 block rounded-xl bg-primary px-3 py-3 text-center font-bold text-white dark:text-stone-900"
                  onClick={() => setOpen(false)}
                >
                  Get the app
                </Link>
              </li>
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
