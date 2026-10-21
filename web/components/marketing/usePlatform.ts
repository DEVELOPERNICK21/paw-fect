"use client";

import { useEffect, useState } from "react";

export type Platform = "ios" | "android" | "other";

/** Detects the visitor's phone OS after mount (desktop and SSR stay "other"). */
export function usePlatform(): Platform {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/android/i.test(ua)) {
      setPlatform("android");
    } else if (
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    ) {
      setPlatform("ios");
    }
  }, []);

  return platform;
}
