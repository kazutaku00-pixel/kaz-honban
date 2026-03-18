import { Header } from "@/components/landing/header";
import { Hero } from "@/components/landing/hero";
import { Teachers } from "@/components/landing/teachers";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { FAQ } from "@/components/landing/faq";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Teachers />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
