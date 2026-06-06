import Nav from "@/components/Nav";
import Section from "@/components/Section";
import Reveal from "@/components/Reveal";
import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import WhyItsHard from "@/components/sections/WhyItsHard";
import HowItWorks from "@/components/sections/HowItWorks";
import FeatureCorrelations from "@/components/viz/FeatureCorrelations";
import InsideTheSketch from "@/components/sections/InsideTheSketch";
import AnalystExperience from "@/components/sections/AnalystExperience";
import WhoWeAre from "@/components/sections/WhoWeAre";
import Closing from "@/components/sections/Closing";
import PaperFooter from "@/components/sections/PaperFooter";

export default function Page() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Problem />
      <WhyItsHard />
      <Section
        id="features"
        index="03"
        tag="Feature construction"
        title={
          <>
            Fifty base signals, <span className="text-signal">multiplied in pairs</span>, packed into one
            vector.
          </>
        }
      >
        <p className="max-w-3xl text-lg leading-relaxed text-muted">
          This is purely the mechanism — how the feature vector is assembled, nothing about detection or
          results. Fifty base features are <span className="text-ink">z-scored</span>, then every pair is
          multiplied to form order-2 correlations, expanding 50 → 1,275 before the vector is amplitude-encoded.
        </p>
        <Reveal>
          <div className="panel mt-8 bg-panel-2 p-4 md:p-6">
            <FeatureCorrelations />
          </div>
        </Reveal>
      </Section>
      <HowItWorks />
      <InsideTheSketch />
      <AnalystExperience />
      <WhoWeAre />
      <Closing />
      <PaperFooter />
    </main>
  );
}
