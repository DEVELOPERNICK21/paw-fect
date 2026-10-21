import { AppPhoneMockup } from "@/components/marketing/AppPhoneMockup";
import { StoreButtons } from "@/components/marketing/StoreButtons";
import { downloadAppScreenshot } from "@/lib/app-screenshots";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download",
  description: "Get the app on the App Store and Google Play: free tier available.",
};

export default function DownloadPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">Download Pawfect</h1>
            <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
              Now available on the App Store and Google Play. Free forever plan. No credit card required.
            </p>
            <StoreButtons source="download_page" className="mt-10" />
          </div>
          <div className="flex items-center justify-center">
            <AppPhoneMockup
              image={downloadAppScreenshot}
              alt="Pawfect app home screen in light mode on a phone"
              size="xl"
              float={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
