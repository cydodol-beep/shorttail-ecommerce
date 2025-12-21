export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  isNew?: boolean;
  isBestSeller?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Premium Dog Food',
    price: 49.99,
    originalPrice: 59.99,
    rating: 4.8,
    reviews: 124,
    image: 'https://picsum.photos/id/1062/400/400',
    category: 'Dogs',
    isBestSeller: true
  },
  {
    id: '2',
    name: 'Interactive Cat Toy',
    price: 24.50,
    rating: 4.5,
    reviews: 89,
    image: 'https://picsum.photos/id/1074/400/400',
    category: 'Cats',
    isNew: true
  },
  {
    id: '3',
    name: 'Ergonomic Pet Bed',
    price: 89.00,
    originalPrice: 110.00,
    rating: 4.9,
    reviews: 210,
    image: 'https://picsum.photos/id/582/400/400',
    category: 'Dogs',
    isBestSeller: true
  },
  {
    id: '4',
    name: 'Organic Bird Seeds',
    price: 15.99,
    rating: 4.3,
    reviews: 45,
    image: 'https://picsum.photos/id/292/400/400',
    category: 'Birds',
    isNew: true
  },
  {
    id: '5',
    name: 'Aquarium Filter Pro',
    price: 34.99,
    rating: 4.6,
    reviews: 67,
    image: 'https://picsum.photos/id/40/400/400',
    category: 'Fish'
  },
  {
    id: '6',
    name: 'Leather Dog Collar',
    price: 29.99,
    originalPrice: 35.00,
    rating: 4.7,
    reviews: 150,
    image: 'https://picsum.photos/id/659/400/400',
    category: 'Dogs',
    isBestSeller: true
  },
  {
    id: '7',
    name: 'Cat Scratching Post',
    price: 55.00,
    rating: 4.8,
    reviews: 92,
    image: 'https://picsum.photos/id/593/400/400',
    category: 'Cats',
    isNew: true
  },
  {
    id: '8',
    name: 'Rabbit Hutch',
    price: 120.00,
    originalPrice: 150.00,
    rating: 4.4,
    reviews: 30,
    image: 'https://picsum.photos/id/250/400/400',
    category: 'Small Pets'
  },
  // Additional Products for Pagination
  {
    id: '9',
    name: 'Automatic Feeder',
    price: 79.99,
    rating: 4.7,
    reviews: 205,
    image: 'https://picsum.photos/id/1080/400/400',
    category: 'Dogs',
    isBestSeller: true
  },
  {
    id: '10',
    name: 'Luxury Bird Cage',
    price: 145.00,
    originalPrice: 180.00,
    rating: 4.9,
    reviews: 56,
    image: 'https://picsum.photos/id/146/400/400',
    category: 'Birds',
    isBestSeller: true
  },
  {
    id: '11',
    name: 'Fish Tank LED Light',
    price: 45.00,
    rating: 4.5,
    reviews: 78,
    image: 'https://picsum.photos/id/214/400/400',
    category: 'Fish',
    isNew: true
  },
  {
    id: '12',
    name: 'Plush Squeaky Toy',
    price: 12.99,
    rating: 4.6,
    reviews: 312,
    image: 'https://picsum.photos/id/1020/400/400',
    category: 'Dogs',
    isBestSeller: true
  },
  {
    id: '13',
    name: 'Cat Water Fountain',
    price: 39.99,
    rating: 4.7,
    reviews: 143,
    image: 'https://picsum.photos/id/514/400/400',
    category: 'Cats',
    isNew: true
  },
  {
    id: '14',
    name: 'Hamster Wheel',
    price: 18.50,
    rating: 4.4,
    reviews: 65,
    image: 'https://picsum.photos/id/96/400/400',
    category: 'Small Pets',
    isNew: true
  },
  {
    id: '15',
    name: 'Dog Raincoat',
    price: 32.00,
    originalPrice: 40.00,
    rating: 4.8,
    reviews: 98,
    image: 'https://picsum.photos/id/837/400/400',
    category: 'Dogs',
    isBestSeller: true
  },
  {
    id: '16',
    name: 'Catnip Treats',
    price: 8.99,
    rating: 4.9,
    reviews: 420,
    image: 'https://picsum.photos/id/169/400/400',
    category: 'Cats',
    isBestSeller: true
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Jenkins',
    role: 'Dog Mom',
    content: "The quality of the products is unmatched. My Golden Retriever absolutely loves the premium food!",
    avatar: 'https://picsum.photos/id/64/100/100'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Cat Enthusiast',
    content: "Fast shipping and great customer service. The interactive toys keep my cats busy for hours.",
    avatar: 'https://picsum.photos/id/91/100/100'
  },
  {
    id: '3',
    name: 'Emily Davis',
    role: 'Bird Trainer',
    content: "I love the organic options available. It's hard to find healthy treats for parrots, but ShortTail.id has it all.",
    avatar: 'https://picsum.photos/id/129/100/100'
  }
];

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '#categories' },
  { label: 'Sale', href: '#flash-sale' },
  { label: 'New', href: '#new-arrivals' },
  { label: 'Contact', href: '#footer' },
];