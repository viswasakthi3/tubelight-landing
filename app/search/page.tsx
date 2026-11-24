import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "@/components/search/search.css";
import { QS_FAQ, SearchLanding } from "@/components/search/SearchLanding";

import { MAIN_SITE, QUICK_SEARCH_URL } from "@/lib/site-host";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const TITLE = "Quick Search AI for Windows | Voice Search in Any App (Hold Tab + Q)";
const DESCRIPTION =
  "Quick Search AI brings instant voice search to Windows 10 & 11. Hold Tab + Q in any app to ask out loud and get a concise web answer with sources, read aloud. Snip screen with Tab + S. 50 free searches daily. No sign-up.";
const CARD_IMAGE = `${MAIN_SITE}/search/card.png`;

export const metadata: Metadata = {
  metadataBase: new URL(MAIN_SITE),
  title: { absolute: TITLE },
  description: DESCRIPTION,
  applicationName: "Quick Search AI",
  category: "Productivity",
  keywords: [
    "Quick Search AI",
    "voice search Windows",
    "Windows AI assistant",
    "Hold Tab Q",
    "Tab S screen search",
    "AI search Windows 11",
    "desktop AI search",
    "voice search app",
    "OCR screen search",
    "free AI search desktop",
    "AI answer engine Windows",
  ],
  authors: [{ name: "Tubelight", url: "https://tubelight.net" }],
  creator: "Tubelight",
  publisher: "Tubelight",
  alternates: { canonical: QUICK_SEARCH_URL },
  icons: { icon: "/search/icon.png", apple: "/search/icon.png" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: QUICK_SEARCH_URL,
    siteName: "Quick Search AI by Tubelight",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: CARD_IMAGE,
        width: 1920,
        height: 1080,
        alt: "Quick Search AI for Windows: Hold Tab + Q to voice search in any app",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [CARD_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = { themeColor: "#12101c" };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${QUICK_SEARCH_URL}#app`,
      name: "Quick Search AI",
      operatingSystem: "Windows 10, Windows 11",
      applicationCategory: "UtilitiesApplication",
      applicationSubCategory: "Voice Search & AI Assistant",
      description: DESCRIPTION,
      url: QUICK_SEARCH_URL,
      installUrl: "https://apps.microsoft.com/detail/9NFK7MS99FB3",
      image: CARD_IMAGE,
      screenshot: [
        `${MAIN_SITE}/search/shots/qs-01-hold-tab-q.png`,
        `${MAIN_SITE}/search/shots/qs-02-hold-ask-let-go.png`,
        `${MAIN_SITE}/search/shots/qs-03-stop-opening-tabs.png`,
        `${MAIN_SITE}/search/shots/qs-04-highlight-a-word.png`,
        `${MAIN_SITE}/search/shots/qs-05-ask-about-your-screen.png`,
        `${MAIN_SITE}/search/shots/qs-06-one-answer-with-proof.png`,
        `${MAIN_SITE}/search/shots/qs-07-free-50-a-day.png`,
      ],
      featureList: [
        "Voice search in any app with Tab + Q",
        "Instant context lookup for highlighted text",
        "Screen snip & OCR search with Tab + S",
        "Multi-source web synthesis with verifiable citations",
        "Text-to-speech spoken narration of answers",
        "50 free searches per device daily",
        "Zero account or sign-up required",
        "Local search history stored on PC",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      publisher: { "@id": "https://tubelight.net/#organization" },
    },
    {
      "@type": "FAQPage",
      "@id": `${QUICK_SEARCH_URL}#faq`,
      mainEntity: QS_FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@type": "WebPage",
      "@id": `${QUICK_SEARCH_URL}#webpage`,
      url: QUICK_SEARCH_URL,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "en-US",
      isPartOf: { "@id": `${MAIN_SITE}/#website` },
      about: { "@id": `${QUICK_SEARCH_URL}#app` },
      primaryImageOfPage: { "@id": `${QUICK_SEARCH_URL}#primaryimage` },
    },
    {
      "@type": "ImageObject",
      "@id": `${QUICK_SEARCH_URL}#primaryimage`,
      url: CARD_IMAGE,
      contentUrl: CARD_IMAGE,
      width: 1920,
      height: 1080,
      caption: "Quick Search AI for Windows: Hold Tab + Q to voice search in any app",
    },
  ],
};

export default function SearchPage() {
  return (
    <div className={manrope.variable}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <SearchLanding />
    </div>
  );
}
