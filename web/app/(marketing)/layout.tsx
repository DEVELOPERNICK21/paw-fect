import { ChatbaseChatbot } from "@/components/marketing/ChatbaseChatbot";
import { Footer } from "@/components/marketing/Footer";
import { Navbar } from "@/components/marketing/Navbar";
import { StickyMobileCta } from "@/components/marketing/StickyMobileCta";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="pb-24 md:pb-0">
        {children}
      </main>
      <Footer />
      <StickyMobileCta />
      <ChatbaseChatbot />
    </>
  );
}
