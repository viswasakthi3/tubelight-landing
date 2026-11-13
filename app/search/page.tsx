import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "@/components/search/search.css";
import { QS_FAQ, SearchLanding } from "@/components/search/SearchLanding";

/* search.tubelight.net — the Quick Search AI landing page.
   middleware.ts serves this at "/" on the search.* host. The Tubelight landing is untouched. */

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap", weight: ["500", "600", "700", "800"] });

const SITE = "https://search.tubelight.net";
const TITLE = "Quick Search AI: stop opening new tabs";
const DESCRIPTION =
  "Hold Tab + Q in any Windows app and ask out loud. Let go, and a short answer pops up in the corner, checked on the web and read out loud. 50 free searches a day, no account.";

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
    images: [{ url: "/search/og.jpg", width: 1200, height: 675, alt: "Quick Search AI: ask anything, anywhere. Hold Tab + Q." }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/search/og.jpg"] },
  keywords: ["Quick Search AI", "voice search Windows", "ask AI any app", "Tab + Q", "AI answers", "Tubelight"],
};

export const viewport: Viewport = { themeColor: "#12101c" };

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Quick Search AI",
    operatingSystem: "Windows 10, Windows 11",
    applicationCategory: "UtilitiesApplication",
    description: DESCRIPTION,
    url: SITE,
    downloadUrl: "https://apps.microsoft.com/detail/9NFK7MS99FB3",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "Tubelight", url: "https://tubelight.net" },
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
