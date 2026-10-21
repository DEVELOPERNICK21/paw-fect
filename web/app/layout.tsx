import type { Metadata } from "next";
import localFont from "next/font/local";
import { Outfit } from "next/font/google";
import { ThemeScript } from "@/components/admin/ThemeScript";
import "./globals.css";
import { IOS_APP_ID } from "@/lib/store-links";
import { Providers } from "./providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL &&
  /^https?:\/\//.test(process.env.NEXT_PUBLIC_SITE_URL)
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pawfect: Pet Care & Reminders for Dogs & Cats",
    template: "%s - Pawfect",
  },
  description:
    "Age-aware vaccine and deworming schedules, daily care reminders and health records for dogs and cats. Free on iPhone and Android.",
  // iOS Safari "Smart App Banner": offers Open / Get for the live app.
  itunes: { appId: IOS_APP_ID },
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon.png", type: "image/png", sizes: "432x432" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${outfit.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
