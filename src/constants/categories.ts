// Category interface without JSX elements
export interface Category {
  id: string;
  name: string;
  iconType: 'Dog' | 'Cat' | 'Fish' | 'Bird' | 'Rabbit'; // Icon type to be rendered separately
  image: string;
}

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Dogs', iconType: 'Dog', image: 'https://picsum.photos/id/237/400/400' },
  { id: '2', name: 'Cats', iconType: 'Cat', image: 'https://picsum.photos/id/40/400/400' },
  { id: '3', name: 'Fish', iconType: 'Fish', image: 'https://picsum.photos/id/200/400/400' },
  { id: '4', name: 'Birds', iconType: 'Bird', image: 'https://picsum.photos/id/1025/400/400' },
];