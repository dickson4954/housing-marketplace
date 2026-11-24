import MarketplaceIntroSlide from '@/components/onboarding/MarketplaceIntroSlide';

export default function IntroOne() {
  return (
    <MarketplaceIntroSlide
      step={1}
      eyebrow="HOMES & REAL ESTATE"
      title="Find a place."
      accent="Find your fit."
      description="Discover rental homes, apartments, bedsitters, family houses, hotels and short stays. Explore verified property information and manage your property journey in one place."
      image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=90"
      features={[
        'Long-term rentals and short stays',
        'Property discovery, viewings and inspections',
        'Verified listings and secure booking payments',
      ]}
      nextRoute="/onboarding/intro-2"
    />
  );
}
