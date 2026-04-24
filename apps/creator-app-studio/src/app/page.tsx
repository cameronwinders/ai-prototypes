import { AppTypeGrid } from "@/components/AppTypeGrid";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { LeadCaptureSection } from "@/components/LeadCaptureSection";
import { OpportunitySection } from "@/components/OpportunitySection";
import { PartnershipSection } from "@/components/PartnershipSection";
import { ProcessSection } from "@/components/ProcessSection";
import { QualitySection } from "@/components/QualitySection";
import { VerticalExampleCards } from "@/components/VerticalExampleCards";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative overflow-x-clip pb-10">
        <HeroSection />
        <OpportunitySection />
        <AppTypeGrid />
        <VerticalExampleCards />
        <ProcessSection />
        <PartnershipSection />
        <QualitySection />
        <LeadCaptureSection />
      </main>
      <Footer />
    </>
  );
}
