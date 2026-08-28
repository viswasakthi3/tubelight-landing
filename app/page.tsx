import { BetaCTA } from "@/components/BetaCTA";
import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Nav } from "@/components/Nav";

export default function Home() {
  return (
    <>
      <div className="grain relative overflow-hidden">
        <div aria-hidden="true" className="beam pointer-events-none absolute inset-x-0 top-0 h-[70vh]" />
        <Nav />
        <main id="main">
          <Hero />
          <HowItWorks />
        </main>
      </div>

      <div className="grain relative overflow-hidden">
        <BetaCTA />
        <Faq />
      </div>

      <Footer />
    </>
  );
}
