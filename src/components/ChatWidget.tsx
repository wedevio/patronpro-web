"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export default function ChatWidget() {
  const pathname = usePathname();
  if (pathname.startsWith("/panel") || pathname.startsWith("/ghl") || pathname.startsWith("/onboarding")) return null;
  return (
    <Script
      src="https://widgets.leadconnectorhq.com/loader.js" 
      data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js" 
      data-widget-id="6a363b805dcabc40b599a028"
      strategy="lazyOnload"
    />
  );
}
