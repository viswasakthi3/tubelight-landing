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
const title = "Tubelight | AI Visual Explainer for Windows";
const description = "Select text and press Alt + E to get a narrated visual explanation beside your work. Try a topic preview or join the Windows early-access waitlist.";
const image = {
  url: site + "shots/social-preview.jpg", width: 1200, height: 675,
  alt: "Tubelight explains a rocket engine with an illustrated, narrated slide beside a document.",
};

export const metadata: Metadata = {
  title: { absolute: title }, description, applicationName: "Tubelight",
  alternates: { canonical: site },
  openGraph: { type: "website", url: site, siteName: "Tubelight", title, description, images: [image] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": site + "#website", url: site, name: "Tubelight", about: { "@id": site + "#app" } },
    { "@type": "SoftwareApplication", "@id": site + "#app", name: "Tubelight", url: site,
      applicationCategory: "EducationalApplication", operatingSystem: "Windows 10, Windows 11",
      description, image: image.url, featureList: ["Explain selected text with Alt + E", "Search a topic", "Hear narration with captions", "Revisit saved explanations"] },
    { "@type": "FAQPage", "@id": site + "#faq", mainEntity: FAQS.map(({q, a}) => ({
      "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a },
    })) },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
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
