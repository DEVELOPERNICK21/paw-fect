import type { StaticImageData } from "next/image";

import shot212921 from "@/app/assets/Images/Screenshot_20260412-212921.png";
import shot212941 from "@/app/assets/Images/Screenshot_20260412-212941.png";
import shot213000 from "@/app/assets/Images/Screenshot_20260412-213000.png";
import shot213013 from "@/app/assets/Images/Screenshot_20260412-213013.png";
import shot213020 from "@/app/assets/Images/Screenshot_20260412-213020.png";
import shot213025 from "@/app/assets/Images/Screenshot_20260412-213025.png";
import shot213029 from "@/app/assets/Images/Screenshot_20260412-213029.png";
import shot213032 from "@/app/assets/Images/Screenshot_20260412-213032.png";

export type AppScreenshot = {
  id: string;
  src: StaticImageData;
  alt: string;
  label: string;
};

/** Primary marketing visual: home dashboard (dark). */
export const heroAppScreenshot: StaticImageData = shot212921;

/** Download / secondary hero: home (light). */
export const downloadAppScreenshot: StaticImageData = shot213020;

export const appGalleryScreenshots: readonly AppScreenshot[] = [
  {
    id: "home-dark",
    src: shot212921,
    alt: "Pawsoul app home dashboard in dark mode showing pet status and care summary",
    label: "Home (dark)",
  },
  {
    id: "home-dark-2",
    src: shot213000,
    alt: "Pawsoul home screen with pet selector and current status card",
    label: "Dashboard",
  },
  {
    id: "alerts",
    src: shot213013,
    alt: "Pawsoul home with health reminders and attention banner",
    label: "Reminders",
  },
  {
    id: "home-light",
    src: shot213020,
    alt: "Pawsoul app home in light mode",
    label: "Home (light)",
  },
  {
    id: "care-actions",
    src: shot213025,
    alt: "Pawsoul quick actions and today care sections",
    label: "Care & actions",
  },
  {
    id: "profile-hero",
    src: shot212941,
    alt: "Pawsoul pet profile with photo and details",
    label: "Pet profile",
  },
  {
    id: "profile-stats",
    src: shot213029,
    alt: "Pawsoul pet profile with weight and stats",
    label: "Profile details",
  },
  {
    id: "notifications",
    src: shot213032,
    alt: "Pawsoul notifications screen",
    label: "Notifications",
  },
] as const;
