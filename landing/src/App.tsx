import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { StatsBanner } from "./components/StatsBanner";
import { UseCaseDecider } from "./components/UseCaseDecider";
import { InteractiveShowcase } from "./components/InteractiveShowcase";
import { ArchitectureSection } from "./components/ArchitectureSection";
import { FeaturesGrid } from "./components/FeaturesGrid";
import { DevelopersSection } from "./components/DevelopersSection";
import { QuickstartSection } from "./components/QuickstartSection";
import { ComparisonSection } from "./components/ComparisonSection";
import { PricingSection } from "./components/PricingSection";
import { FaqSection } from "./components/FaqSection";
import { CtaBanner } from "./components/CtaBanner";
import { Footer } from "./components/Footer";

export default function App() {
  const reduceMotion = useReducedMotion();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 900);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <div className="landing-root relative min-h-screen overflow-x-clip bg-[#080C14] text-white">
      {/* Ambient canvas: dark base with softly blended bright gradients */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#080C14_0%,#0C1224_28%,#0A1020_52%,#0D1226_74%,#080C14_100%)]" />
        <div className="absolute -left-[18%] top-[2%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(240,122,38,0.13),transparent_68%)] blur-3xl" />
        <div className="absolute -right-[18%] top-[30%] h-[820px] w-[820px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12),transparent_68%)] blur-3xl" />
        <div className="absolute left-[8%] top-[60%] h-[900px] w-[900px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.09),transparent_68%)] blur-3xl" />
        <div className="absolute -right-[12%] top-[82%] h-[740px] w-[740px] rounded-full bg-[radial-gradient(circle,rgba(217,70,239,0.08),transparent_68%)] blur-3xl" />
      </div>

      <div className="relative z-10">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[#F07A26] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white">
        Skip to content
      </a>

      <Navbar />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <main id="main">
          <Hero />
          <StatsBanner />
          <UseCaseDecider />
          <InteractiveShowcase />
          <ArchitectureSection />
          <FeaturesGrid />
          <DevelopersSection />
          <QuickstartSection />
          <ComparisonSection />
          <PricingSection />
          <FaqSection />
          <CtaBanner />
        </main>

        <Footer />
      </motion.div>

      <AnimatePresence>
        {showTop ? (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            whileHover={{ y: -2 }}
            onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" })}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-40 hidden h-10 w-10 items-center justify-center rounded-full border border-[#1E2838] bg-[#0E1420] text-[#94A3B8] shadow-xl transition-colors hover:border-[#F07A26] hover:text-white lg:flex"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        ) : null}
      </AnimatePresence>
      </div>
    </div>
    </MotionConfig>
  );
}
