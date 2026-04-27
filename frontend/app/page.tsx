import { AnimatedHero } from '@/components/AnimatedHero';
import { FeaturesSection } from '@/components/FeaturesSection';
import { CallToAction, Footer } from '@/components/LandingPageBlocks';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-bg overflow-x-hidden selection:bg-brand-red/30 selection:text-brand-red transition-colors duration-300">
      <AnimatedHero />
      <FeaturesSection />
      <CallToAction />
      <Footer />
    </main>
  );
}
