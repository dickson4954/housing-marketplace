import MarketplaceIntroSlide from '@/components/onboarding/MarketplaceIntroSlide';

export default function IntroThree() {
  return (
    <MarketplaceIntroSlide
      step={3}
      eyebrow="FOOD, BEAUTY & SERVICES"
      title="More ways to"
      accent="make life easier."
      description="Find restaurants, order food, discover salons and beauty businesses, and connect with service providers. Access the services you need through one marketplace."
      image="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1600&q=90"
      features={[
        'Restaurants, menus and food orders',
        'Salons, spas and beauty services',
        'Appointments and service bookings',
        'Discover local businesses and experiences',
      ]}
      nextRoute="/onboarding/intro-4"
    />
  );
}
