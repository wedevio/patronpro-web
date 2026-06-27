"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const PATRONPRO_LIVE_CHAT_WIDGET_ID = "6a3fa8918ac6276654579733";

export default function ChatWidget() {
  const pathname = usePathname();
  if (pathname.startsWith("/panel") || pathname.startsWith("/ghl") || pathname.startsWith("/onboarding")) return null;
  return (
    <Script
      src="https://widgets.leadconnectorhq.com/loader.js"
      data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id={PATRONPRO_LIVE_CHAT_WIDGET_ID}
      strategy="lazyOnload"
    />
  );
}
