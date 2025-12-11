export type AppRole = 'master_admin' | 'normal_admin' | 'kasir' | 'super_user' | 'normal_user';
export type MembershipTier = 'Newborn' | 'Transitional' | 'Juvenile' | 'Adolescence' | 'Adulthood';
export type OrderStatus = 'pending' | 'paid' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type OrderSource = 'marketplace' | 'pos';

export interface Profile {
  id: string;
  user_phoneno: string;
  user_name: string | null;
  user_email: string | null;
  user_avatar_url: string | null;
  role: AppRole;
  tier: MembershipTier;
  points_balance: number;
  referral_code: string | null;
  referred_by: string | null;
  address_line1: string | null;
  city: string | null;
  region_state_province: string | null;
  province_id: number | null;
  postal_code: string | null;
  country_id: number;
  recipient_name: string | null;
  recipient_address_line1: string | null;
  recipient_city: string | null;
  recipient_region: string | null;
  recipient_province_id: number | null;
  recipient_postal_code: string | null;
  recipient_phoneno: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  pet_type: string;
  pet_name: string;
  pet_birthday: string | null;
  pet_gender: string | null;
  pet_weight_kg: number | null;
  pet_chip_id: string | null;
  pet_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  category: string | null;
  category_id: string | null;
  base_price: number;
  stock_quantity: number;
  condition: 'new' | 'secondhand' | null;
  has_variants: boolean;
  main_image_url: string | null;
  gallery_image_urls: string[] | null;
  unit_weight_grams: number;
  is_active: boolean;
  related_product_ids: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string | null;
  variant_image_url: string | null;
  unit_label: string | null;
  weight_grams: number | null;
  price_adjustment: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingCourier {
  id: number;
  courier_name: string;
  courier_logo_url: string | null;
  base_cost: number | null;
  is_active: boolean;
}

export interface Promotion {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | 'buy_x_get_y';
  discount_value: number | null;
  min_purchase_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

export interface Order {
  id: string;
  user_id: string | null;
  cashier_id: string | null;
  source: OrderSource;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  discount_amount: number;
  total_amount: number;
  shipping_courier_name: string | null;
  shipping_address_snapshot: Record<string, unknown> | null;
  invoice_url: string | null;
  packing_list_url: string | null;
  is_packing_list_downloaded: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price_at_purchase: number;
}

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  action_link: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string | null;
  product_id: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; user_phoneno: string };
        Update: Partial<Profile>;
      };
      pets: {
        Row: Pet;
        Insert: Omit<Pet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Pet>;
      };
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Product>;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ProductVariant>;
      };
      shipping_couriers: {
        Row: ShippingCourier;
        Insert: Omit<ShippingCourier, 'id'>;
        Update: Partial<ShippingCourier>;
      };
      promotions: {
        Row: Promotion;
        Insert: Omit<Promotion, 'id'>;
        Update: Partial<Promotion>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Order>;
      };
      order_items: {
        Row: OrderItem;
        Insert: Omit<OrderItem, 'id'>;
        Update: Partial<OrderItem>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Notification>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: Partial<Review>;
      };
    };
  };
}
