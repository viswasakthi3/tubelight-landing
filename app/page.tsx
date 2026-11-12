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
