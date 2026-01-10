// Shipping configuration for RajaOngkir integration
import { createClient } from '@/lib/supabase/client';

// Define the available courier services in RajaOngkir Starter plan
export const AVAILABLE_COURIERS = [
  { code: 'jne', name: 'JNE', logo: '/logos/jne.png' },
];

// Define allowed JNE service types
export const ALLOWED_JNE_SERVICES = ['REG', 'YES'];

// Default origin for shipping (Jakarta, as an example)
export const DEFAULT_ORIGIN_CITY_ID = '151'; // Jakarta Pusat

// Function to get origin city ID from store settings or default
export async function getOriginCityId(): Promise<string> {
  const supabase = createClient();

  try {
    // Try to get origin city from store settings
    const { data, error } = await supabase
      .from('store_settings')
      .select('shipping_origin_city_id')
      .single();

    if (error) {
      console.warn('Error fetching store settings for shipping origin:', error);
      return DEFAULT_ORIGIN_CITY_ID; // Default to Jakarta
    }

    // Check if the shipping_origin_city_id column exists in the response
    if (data && typeof data === 'object' && 'shipping_origin_city_id' in data) {
      if (data.shipping_origin_city_id) {
        return data.shipping_origin_city_id;
      }
    }

    return DEFAULT_ORIGIN_CITY_ID;
  } catch (error) {
    console.warn('Exception fetching store settings for shipping origin, using default:', error);
    return DEFAULT_ORIGIN_CITY_ID;
  }
}

// Function to map RajaOngkir response to our shipping courier format
export interface ShippingCourier {
  id: string;
  name: string;
  price: number;
  eta: string;
  description?: string;
}

// Map RajaOngkir cost result to our internal format
export function mapRajaOngkirToCourier(
  costResult: any, // Using 'any' for the cost result object
  courierCode: string
): ShippingCourier[] {
  if (!costResult.cost) {
    return [];
  }

  return costResult.cost.map((costDetail: any) => ({
    id: `${courierCode}-${costResult.service}`.toLowerCase(),
    name: `${courierCode.toUpperCase()} ${costResult.service}`,
    price: costDetail.value,
    eta: costDetail.etd,
    description: costDetail.note || costResult.description,
  }));
}