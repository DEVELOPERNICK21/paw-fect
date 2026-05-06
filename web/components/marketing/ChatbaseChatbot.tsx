import type { ReactElement } from "react";
import Script from "next/script";

const EMBED_SCRIPT_SRC = "https://www.chatbase.co/embed.min.js" as const;
const DEFAULT_DOMAIN = "www.chatbase.co" as const;

/**
 * Chatbase AI widget (train at https://www.chatbase.co). Renders nothing until
 * `NEXT_PUBLIC_CHATBASE_CHATBOT_ID` is set in the environment.
 */
export function ChatbaseChatbot(): ReactElement | null {
  if (process.env.NEXT_PUBLIC_CHATBASE_DISABLED === "true") {
    return null;
  }

  const chatbotId = process.env.NEXT_PUBLIC_CHATBASE_CHATBOT_ID?.trim();
  const domain = (
    process.env.NEXT_PUBLIC_CHATBASE_DOMAIN ?? DEFAULT_DOMAIN
  ).trim();

  if (!chatbotId) {
    return null;
  }

  const embeddedChatbotConfig = JSON.stringify({ chatbotId, domain });

  return (
    <Script
      id="chatbase-embed-loader"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(){window.embeddedChatbotConfig=${embeddedChatbotConfig};var s=document.createElement("script");s.src=${JSON.stringify(EMBED_SCRIPT_SRC)};s.async=true;document.head.appendChild(s);})();`,
      }}
    />
  );
}
