import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import { FAQS } from "@/components/Faq";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tubelight.net";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tubelight — The Visual Learning Platform for Fast Understanding",
    template: "%s | Tubelight",
  },
  description:
    "Tubelight is the visual learning platform for Windows. Highlight any text, press Alt + E, and get an interactive UI diagram and voice explanation to understand complex topics fast.",
  applicationName: "Tubelight",
  authors: [{ name: "Tubelight Team", url: siteUrl }],
  creator: "Tubelight",
  publisher: "Tubelight",
  keywords: [
    "visual learning platform",
    "learn fast with UI",
    "Tubelight",
    "visual explanations",
    "interactive diagrams",
    "explain anything",
    "Windows learning app",
    "Alt + E shortcut",
    "AI diagrams",
    "voice narration study tool",
    "dual coding theory",
    "concept maps",
    "fast understanding",
  ],
  alternates: {
    canonical: siteUrl,
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
  openGraph: {
    title: "Tubelight — The Visual Learning Platform for Fast Understanding",
    description:
      "Highlight any text on Windows, press Alt + E, and an interactive UI diagram draws itself with voice narration to help you learn fast.",
    url: siteUrl,
    siteName: "Tubelight",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/shots/hero-blackhole.webp",
        width: 2590,
        height: 1632,
        alt: "Tubelight visual learning platform showing interactive diagram and voice narration panel beside text on Windows",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tubelight — The Visual Learning Platform for Fast Understanding",
    description:
      "Highlight any text on Windows, press Alt + E, and get an interactive drawn diagram with synchronized voice walkthrough. Learn complex topics fast.",
    images: ["/shots/hero-blackhole.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/brand/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/brand/icon-512.png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Tubelight",
        description: "The visual learning platform that uses UI to help people learn complex things fast.",
        publisher: {
          "@id": `${siteUrl}/#organization`,
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Tubelight",
        url: siteUrl,
        logo: `${siteUrl}/brand/icon-512.png`,
      },
      {
        "@type": ["SoftwareApplication", "EducationalApplication"],
        "@id": `${siteUrl}/#application`,
        name: "Tubelight",
        url: siteUrl,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Windows 10, Windows 11",
        description:
          "Tubelight is an AI-powered visual learning platform that turns highlighted text into interactive UI diagrams and synchronized voice narration in seconds.",
        screenshot: `${siteUrl}/shots/hero-blackhole.webp`,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          description: "Free Private Beta with 10 visual explanations included",
        },
        featureList: [
          "Instant Alt + E shortcut across Windows",
          "Real-time 60 FPS vector diagram synthesis",
          "Synchronized natural voiceover narration",
          "Interactive step-by-step visual slides",
          "Dynamic explanation steering (Simpler, Timeline, Analogy)",
          "Local-first privacy with zero text logging",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${siteUrl}/#faq`,
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        {/* Scroll reveals start hidden — without JS they must not blank the page. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {/* Schema.org Structured Data for Google Search & Knowledge Graph */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
