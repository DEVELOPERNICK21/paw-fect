import { AppPhoneMockup } from "@/components/marketing/AppPhoneMockup";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import { Button } from "@/components/ui/Button";
import { downloadAppScreenshot } from "@/lib/app-screenshots";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Download",
  description: "Get Pawfect on iOS and Android — free tier available.",
};

export default function DownloadPage(): React.ReactElement {
  return (
    <div className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-50">Download Pawfect</h1>
        <p className="mt-4 text-lg text-stone-600 dark:text-stone-400">
          Available on iOS and Android. Free forever plan — no credit card required.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Button href="https://apps.apple.com/" className="!bg-stone-900 !text-white">
            App Store
          </Button>
          <Button href="https://play.google.com/store" className="!bg-stone-900 !text-white">
            Google Play
          </Button>
        </div>
        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">Web waitlist</h2>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              Want updates beyond the native apps? Leave your email.
            </p>
            <div className="mt-6">
              <WaitlistForm />
            </div>
          </div>
          <div className="flex items-center justify-center">
            <AppPhoneMockup
              image={downloadAppScreenshot}
              alt="Pawfect app home screen in light mode on a phone"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
