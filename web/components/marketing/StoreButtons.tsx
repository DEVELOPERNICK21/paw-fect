"use client";

import { Download, Smartphone } from "lucide-react";
import { appStoreLink, playStoreLink, type StoreSource } from "@/lib/store-links";
import { usePlatform } from "@/components/marketing/usePlatform";

type StoreButtonsProps = {
  /** Which block of the page this sits in (store analytics attribution). */
  source: StoreSource;
  /** "light" sits on the orange CTA band; "dark" on normal page backgrounds. */
  tone?: "dark" | "light";
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold shadow-xl transition duration-200 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]";

/**
 * Real App Store + Google Play links. The visitor's own store comes first
 * (iPhone visitors see App Store first, Android visitors Google Play first).
 */
export function StoreButtons({ source, tone = "dark", className = "" }: StoreButtonsProps): React.ReactElement {
  const platform = usePlatform();
  const color =
    tone === "light"
      ? "bg-stone-950 text-white"
      : "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900";

  const apple = (
    <a
      key="ios"
      href={appStoreLink(source)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${color}`}
      aria-label="Download Pawfect on the App Store"
    >
      <Download className="h-5 w-5" aria-hidden />
      App Store
    </a>
  );
  const play = (
    <a
      key="android"
      href={playStoreLink(source)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${color}`}
      aria-label="Get Pawfect on Google Play"
    >
      <Smartphone className="h-5 w-5" aria-hidden />
      Google Play
    </a>
  );

  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {platform === "android" ? [play, apple] : [apple, play]}
    </div>
  );
}
