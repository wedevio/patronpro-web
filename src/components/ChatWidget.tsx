"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export default function ChatWidget() {
  const pathname = usePathname();
  if (pathname.startsWith("/panel") || pathname.startsWith("/ghl")) return null;
  return (
    <Script
      src="https://widgets.leadconnectorhq.com/loader.js"
      data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
      data-widget-id="69eba589fa2b28ffe2cf48fa"
      strategy="lazyOnload"
    />
  );
}
