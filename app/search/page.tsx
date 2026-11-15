import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "@/components/search/search.css";
import { QS_FAQ, SearchLanding } from "@/components/search/SearchLanding";

/* search.tubelight.net — the Quick Search AI landing page.
   middleware.ts serves this at "/" on the search.* host. The Tubelight landing is untouched. */

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const SITE = "https://search.tubelight.net";
const TITLE = "Quick Search AI for Windows | Voice Search in Any App (Hold Tab + Q)";
const DESCRIPTION =
  "Quick Search AI brings instant voice search to Windows 10 & 11. Hold Tab + Q in any app to ask out loud and get a concise web answer with sources, read aloud. Snip screen with Tab + S. 50 free searches daily. No sign-up.";
const CARD_IMAGE = `${SITE}/search/card.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
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
  alternates: { canonical: `${SITE}/` },
  icons: { icon: "/search/icon.png", apple: "/search/icon.png" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: `${SITE}/`,
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
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: `${SITE}/`,
      name: "Quick Search AI",
      inLanguage: "en-US",
      publisher: { "@id": "https://tubelight.net/#organization" },
      about: { "@id": `${SITE}/#app` },
    },
    {
      "@type": "Organization",
      "@id": "https://tubelight.net/#organization",
      name: "Tubelight",
      url: "https://tubelight.net",
      logo: "https://tubelight.net/brand/icon-512.png",
      sameAs: [
        "https://apps.microsoft.com/detail/9NFK7MS99FB3",
        "https://search.tubelight.net",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE}/#app`,
      name: "Quick Search AI",
      operatingSystem: "Windows 10, Windows 11",
      applicationCategory: "UtilitiesApplication",
      applicationSubCategory: "Voice Search & AI Assistant",
      description: DESCRIPTION,
      url: `${SITE}/`,
      downloadUrl: "https://apps.microsoft.com/detail/9NFK7MS99FB3",
      image: CARD_IMAGE,
      screenshot: [
        `${SITE}/search/shots/qs-01-hold-tab-q.png`,
        `${SITE}/search/shots/qs-02-hold-ask-let-go.png`,
        `${SITE}/search/shots/qs-03-stop-opening-tabs.png`,
        `${SITE}/search/shots/qs-04-highlight-a-word.png`,
        `${SITE}/search/shots/qs-05-ask-about-your-screen.png`,
        `${SITE}/search/shots/qs-06-one-answer-with-proof.png`,
        `${SITE}/search/shots/qs-07-free-50-a-day.png`,
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
      "@type": "HowTo",
      "@id": `${SITE}/#howto`,
      name: "How to Use Quick Search AI on Windows",
      description:
        "Learn the three fast ways to query Quick Search AI across any Windows application without opening browser tabs.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Ask Out Loud",
          text: "Hold Tab + Q in any Windows app, speak your question out loud, and release the keys to get an instant answer in the corner.",
          image: `${SITE}/search/shots/qs-01-hold-tab-q.png`,
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Look Up Words You See",
          text: "Highlight any word or passage in a document, browser, or PDF, then press Tab + Q for immediate explanation.",
          image: `${SITE}/search/shots/qs-04-highlight-a-word.png`,
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Ask About Your Screen",
          text: "Press Tab + S to snip any region of your screen, then ask questions about it or copy text with native OCR.",
          image: `${SITE}/search/shots/qs-05-ask-about-your-screen.png`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#faq`,
      mainEntity: QS_FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@type": "WebPage",
      "@id": `${SITE}/#webpage`,
      url: `${SITE}/`,
      name: TITLE,
      description: DESCRIPTION,
      inLanguage: "en-US",
      isPartOf: { "@id": `${SITE}/#website` },
      about: { "@id": `${SITE}/#app` },
      primaryImageOfPage: { "@id": `${SITE}/#primaryimage` },
    },
    {
      "@type": "ImageObject",
      "@id": `${SITE}/#primaryimage`,
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
