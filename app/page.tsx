import type { Metadata } from "next";
import { FAQS } from "@/lib/faqs";
import "@/components/v5/v5.css";
import { Comparison } from "@/components/v5/Comparison";
import { DemoFilm } from "@/components/v5/DemoFilm";
import { V5Faq } from "@/components/v5/Faq";
import { Features } from "@/components/v5/Features";
import { FinalCta } from "@/components/v5/FinalCta";
import { V5Footer } from "@/components/v5/Footer";
import { Gallery } from "@/components/v5/Gallery";
import { Hero } from "@/components/v5/Hero";
import { Nav } from "@/components/v5/Nav";
import { V5Providers } from "@/components/v5/Providers";
import { Who } from "@/components/v5/Who";
import { getVideos } from "@/lib/videos";

const site = "https://tubelight.net/";
const title = "Tubelight | AI Visual Explainer for Windows (Alt + E)";
const description =
  "Select text and press Alt + E to get a narrated visual explanation beside your work. Dual-coding visual learning for Windows 10 & 11.";
const image = {
  url: site + "shots/social-preview.jpg",
  width: 1200,
  height: 675,
  alt: "Tubelight explains a rocket engine with an illustrated, narrated slide beside a document.",
  type: "image/jpeg",
};

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { absolute: title },
  description,
  applicationName: "Tubelight",
  category: "Education",
  keywords: [
    "Tubelight",
    "AI visual explainer",
    "Windows AI explainer",
    "Alt E shortcut",
    "dual coding learning",
    "visual learning software",
    "narrated visual slides",
    "desktop AI explainer",
    "interactive topic search",
    "AI learning platform Windows",
  ],
  authors: [{ name: "Tubelight", url: "https://tubelight.net" }],
  creator: "Tubelight",
  publisher: "Tubelight",
  alternates: { canonical: site },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site,
    siteName: "Tubelight",
    title,
    description,
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image.url],
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

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": site + "#website",
      url: site,
      name: "Tubelight",
      inLanguage: "en-US",
      publisher: { "@id": site + "#organization" },
      about: { "@id": site + "#app" },
    },
    {
      "@type": "Organization",
      "@id": site + "#organization",
      name: "Tubelight",
      url: site,
      logo: site + "brand/icon-512.png",
      sameAs: [
        "https://search.tubelight.net",
        "https://apps.microsoft.com/detail/9NFK7MS99FB3",
      ],
    },
    {
      "@type": "SoftwareApplication",
      "@id": site + "#app",
      name: "Tubelight",
      url: site,
      downloadUrl: site + "download",
      image: image.url,
      operatingSystem: "Windows 10, Windows 11",
      applicationCategory: "EducationalApplication",
      applicationSubCategory: "Visual Learning Platform",
      description,
      featureList: [
        "Explain selected text with Alt + E hotkey",
        "Instant side-by-side dock without context switching",
        "Real-time animated vector diagrams and mind maps",
        "Synchronized voice narration with dynamic captions",
        "Topic search with custom visual preview",
        "Revisit and organize saved explanations",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      publisher: { "@id": site + "#organization" },
    },
    {
      "@type": "HowTo",
      "@id": site + "#howto",
      name: "How to Use Tubelight Visual Explainer on Windows",
      description:
        "Learn how to get instant visual explanations for complex topics directly from your active reading window without switching tabs.",
      step: [
        {
          "@type": "HowToStep",
          position: 1,
          name: "Select any text",
          text: "Highlight a difficult term, equation, or paragraph in any PDF, browser, or document.",
        },
        {
          "@type": "HowToStep",
          position: 2,
          name: "Press Alt + E",
          text: "Hit Alt + E to open Tubelight docked right beside your active window without switching contexts.",
        },
        {
          "@type": "HowToStep",
          position: 3,
          name: "Watch and listen",
          text: "Tubelight illustrates the concept with animated diagrams, clear captions, and synchronized voice narration.",
        },
      ],
    },
    {
      "@type": "FAQPage",
      "@id": site + "#faq",
      mainEntity: FAQS.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
    {
      "@type": "WebPage",
      "@id": site + "#webpage",
      url: site,
      name: title,
      description,
      inLanguage: "en-US",
      isPartOf: { "@id": site + "#website" },
      about: { "@id": site + "#app" },
      primaryImageOfPage: { "@id": site + "#primaryimage" },
    },
    {
      "@type": "ImageObject",
      "@id": site + "#primaryimage",
      url: image.url,
      contentUrl: image.url,
      width: image.width,
      height: image.height,
      caption: image.alt,
    },
  ],
};

export default function Home() {
  const videos = getVideos();
  return (
    <div
      id="top"
      className="v5"
      style={{
        background: "#FAF8F4",
        color: "#221E3F",
        fontFamily: "var(--font-dm), ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        fontSize: 17,
        lineHeight: 1.6,
        overflowX: "clip",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <V5Providers videos={videos}>
        <Nav />
        <main id="main">
          <Hero />
          <DemoFilm />
          <Comparison />
          <Gallery />
          <Features />
          <Who />
          <V5Faq />
          <FinalCta />
        </main>
        <V5Footer />
      </V5Providers>
    </div>
  );
}
