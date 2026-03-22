import { AnimatedHero } from '@/components/AnimatedHero';
import { FeaturesSection } from '@/components/FeaturesSection';
import { CallToAction, Footer } from '@/components/LandingPageBlocks';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black overflow-x-hidden selection:bg-brand-red/30 selection:text-brand-red">
      <AnimatedHero />
      <FeaturesSection />
      <CallToAction />
      <Footer />
    </main>
  );
}
