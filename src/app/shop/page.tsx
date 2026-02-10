import { MarketplaceLanding } from '@/app/marketplace/components/marketplace-landing';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Shop - ShortTail.id Marketplace',
  description: 'Browse our complete collection of premium pet products. Shop food, toys, accessories, and healthcare products for dogs, cats, and small pets.',
};

export default function ShopPage() {
  return <MarketplaceLanding />;
}
