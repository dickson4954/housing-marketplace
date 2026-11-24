import MarketplaceIntroSlide from '@/components/onboarding/MarketplaceIntroSlide';

export default function IntroTwo() {
  return (
    <MarketplaceIntroSlide
      step={2}
      eyebrow="SHOPPING & PRODUCTS"
      title="Everything you need."
      accent="Discover it here."
      description="Explore local shops and products from businesses around you. Compare options, shop across categories and place orders through one connected marketplace."
      image="https://images.unsplash.com/photo-1604719312566-8912e9c8a213?auto=format&fit=crop&w=1600&q=90"
      features={[
        'Supermarkets, groceries and wholesale shops',
        'Hardware, electricals, phones and electronics',
        'Fashion, jerseys, branding and printing',
        'Product discovery, shopping cart and delivery',
      ]}
      nextRoute="/onboarding/intro-3"
    />
  );
}
