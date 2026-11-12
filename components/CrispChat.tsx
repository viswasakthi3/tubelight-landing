"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    $crisp?: any[];
    CRISP_WEBSITE_ID?: string;
  }
}

export function CrispChat() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.$crisp = window.$crisp || [];

    if (isHome) {
      window.$crisp.push(["do", "chat:hide"]);
    } else {
      window.$crisp.push(["do", "chat:show"]);
    }
  }, [isHome]);

  return (
    <>
      <Script
        id="crisp-widget"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="410de723-cda8-40d8-94a4-d2ef329b69e9";${
            isHome ? 'window.$crisp.push(["do","chat:hide"]);' : ''
          }(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
        }}
      />
      {isHome && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .crisp-client,
              #crisp-chatbox,
              [data-chat-status],
              div[class*="crisp-client"] {
                display: none !important;
                visibility: hidden !important;
                pointer-events: none !important;
                opacity: 0 !important;
              }
            `,
          }}
        />
      )}
    </>
  );
}
