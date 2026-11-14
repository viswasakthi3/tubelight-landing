import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "@/components/search/search.css";
import { QS_FAQ, SearchLanding } from "@/components/search/SearchLanding";

/* search.tubelight.net — the Quick Search AI landing page.
   middleware.ts serves this at "/" on the search.* host. The Tubelight landing is untouched. */

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", weight: ["500", "600", "700", "800"] });

const SITE = "https://search.tubelight.net";
const TITLE = "Quick Search AI for Windows | Voice Search in Any App";
const DESCRIPTION =
  "Quick Search AI brings voice search to Windows 10 and 11. Hold Tab + Q in any app to ask a question, then get a concise web answer with sources, read aloud. 50 free searches per device each day. No account required.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { absolute: TITLE },
  description: DESCRIPTION,
  applicationName: "Quick Search AI",
  alternates: { canonical: SITE },
  icons: { icon: "/search/icon.png", apple: "/search/icon.png" },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Quick Search AI",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: SITE + "/search/social-preview.jpg", width: 1200, height: 675, alt: "Quick Search AI shows a sourced answer about Mars beside a browser window on Windows." }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [{ url: SITE + "/search/social-preview.jpg", alt: "Quick Search AI shows a sourced answer about Mars beside a browser window on Windows." }] },
};

export const viewport: Viewport = { themeColor: "#12101c" };

const jsonLd = [
  { "@context": "https://schema.org", "@type": "WebSite", "@id": SITE + "/#website", url: SITE, name: "Quick Search AI", about: { "@id": SITE + "/#app" } },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": SITE + "/#app",
    image: SITE + "/search/social-preview.jpg",
    name: "Quick Search AI",
    operatingSystem: "Windows 10, Windows 11",
    applicationCategory: "ProductivityApplication",
    description: DESCRIPTION,
    url: SITE,
    downloadUrl: "https://apps.microsoft.com/detail/9NFK7MS99FB3",
    featureList: ["Voice questions with Tab + Q", "Look up selected text", "Ask about a screen region with Tab + S", "Web answers with sources", "Read answers aloud", "50 free searches per day"],
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "Vault Labs" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: QS_FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  },
];

export default function SearchPage() {
  return (
    <div className={manrope.variable}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SearchLanding />
    </div>
  );
}
