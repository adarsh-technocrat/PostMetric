import { LANDING_MAX_W } from "@/lib/landing-layout";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PricingPageContent } from "@/components/landing/pricing/PricingPageContent";

export default function PricingPage() {
  return (
    <div className="flex flex-col w-full items-center min-h-screen bg-stone-50">
      <Navbar />
      <main
        className={`items-center w-full ${LANDING_MAX_W} border-x border-stone-200 flex flex-col bg-stone-50`}
      >
        <PricingPageContent />
        <div className="w-full border-b border-stone-200" />
        <Footer />
      </main>
    </div>
  );
}
