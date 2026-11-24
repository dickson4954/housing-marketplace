import MarketplaceIntroSlide from '@/components/onboarding/MarketplaceIntroSlide';

export default function IntroFour() {
  return (
    <MarketplaceIntroSlide
      step={4}
      eyebrow="BUSINESS & DELIVERY NETWORK"
      title="Build your business."
      accent="Grow with MAKAZII."
      description="A connected platform for business owners, teams and delivery partners. Register your business, manage branches, products, orders, staff and business performance from one shared dashboard."
      image="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=90"
      features={[
        'One business registration process for many categories',
        'One shared dashboard with tools for each business type',
        'Manage branches, employees, stock, orders and finances',
        'A connected delivery network with approved riders',
      ]}
      nextRoute="/onboarding/marketplace-entry"
    />
  );
}
