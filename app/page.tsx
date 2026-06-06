import Nav from "@/components/Nav";
import Hero from "@/components/sections/Hero";
import Problem from "@/components/sections/Problem";
import WhyItsHard from "@/components/sections/WhyItsHard";
import HowItWorks from "@/components/sections/HowItWorks";
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
      <HowItWorks />
      <InsideTheSketch />
      <AnalystExperience />
      <WhoWeAre />
      <Closing />
      <PaperFooter />
    </main>
  );
}
