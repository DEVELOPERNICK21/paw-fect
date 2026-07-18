import Link from "next/link";
import { Dog, Heart, Mail } from "lucide-react";

export function Footer(): React.ReactElement {
  return (
    <footer className="relative border-t border-stone-200 bg-gradient-to-b from-cream to-stone-100/80 dark:border-stone-700 dark:from-stone-950 dark:to-stone-900">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary ring-1 ring-primary/20">
                <Dog className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-lg font-bold text-stone-900 dark:text-stone-50">Pawfect</p>
                <p className="text-xs font-medium text-stone-500">Pet health, lovingly organized</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              Vet-aligned schedules for dogs and cats — vaccines, deworming, journey stages, and records in one place.
            </p>
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-stone-500">
              <Heart className="h-3.5 w-3.5 text-primary" aria-hidden />
              Made with love for pets in India
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-10 sm:grid-cols-3 lg:max-w-2xl">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Product
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  { href: "/features", label: "Features" },
                  { href: "/pricing", label: "Pricing" },
                  { href: "/download", label: "Download" },
                  { href: "/blog", label: "Blog" },
                  { href: "/waitlist", label: "Waitlist" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-stone-700 transition hover:text-primary dark:text-stone-300 dark:hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Legal
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/privacy"
                    className="text-stone-700 transition hover:text-primary dark:text-stone-300 dark:hover:text-primary"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-stone-700 transition hover:text-primary dark:text-stone-300 dark:hover:text-primary"
                  >
                    Terms &amp; Conditions
                  </Link>
                </li>
                <li>
                  <Link
                    href="/delete-account"
                    className="text-stone-700 transition hover:text-primary dark:text-stone-300 dark:hover:text-primary"
                  >
                    Delete account
                  </Link>
                </li>
                <li className="text-stone-500">Cookies: analytics only</li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Connect
              </p>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 text-stone-700 transition hover:text-primary dark:text-stone-300"
                  >
                    <Mail className="h-4 w-4" aria-hidden />
                    Contact
                  </Link>
                </li>
                <li className="text-stone-500">Social links coming soon</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-14 border-t border-stone-200/80 pt-8 text-center text-xs leading-relaxed text-stone-500 dark:border-stone-700 dark:text-stone-500">
          <p>
            © {new Date().getFullYear()} Pawfect. Vet-validated protocols. Not a substitute for professional
            veterinary advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
