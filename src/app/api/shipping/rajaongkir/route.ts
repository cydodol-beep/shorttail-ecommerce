// API route to handle RajaOngkir shipping calculations securely
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOriginCityId } from '@/lib/shipping/config';

export async function POST(req: NextRequest) {
  try {
    const { destinationCityId, weight, courier } = await req.json();
    
    // Validate required params
    if (!destinationCityId || !weight || !courier) {
      return Response.json(
        { error: 'Missing required parameters: destinationCityId, weight, courier' },
        { status: 400 }
      );
    }

    // Ensure we have the API key (try both public and private variables)
    const rajaongkirApiKey = process.env.RAJAONGKIR_API_KEY || process.env.NEXT_PUBLIC_RAJAONGKIR_API_KEY;
    if (!rajaongkirApiKey) {
      console.error('RajaOngkir API key is not set in environment variables');
      console.error('Available env vars (partial):', {
        hasRajaongkirApiKey: !!process.env.RAJAONGKIR_API_KEY,
        hasNextPublicRajaongkirApiKey: !!process.env.NEXT_PUBLIC_RAJAONGKIR_API_KEY,
      });
      return Response.json(
        { error: 'Shipping calculation is temporarily unavailable' },
        { status: 500 }
      );
    }

    // Get origin city ID from store settings
    const originCityId = await getOriginCityId();
    if (!originCityId) {
      console.error('Could not determine origin city ID for shipping calculation');
      return Response.json(
        { error: 'Unable to determine shipping origin' },
        { status: 500 }
      );
    }

    // Prepare data for RajaOngkir API
    const requestBody = new URLSearchParams({
      origin: originCityId,
      destination: destinationCityId,
      weight: Math.ceil(Number(weight)).toString(),
      courier: courier.toLowerCase(),
    });

    // Call RajaOngkir API - updated to v2 endpoint as per documentation
    const response = await fetch('https://api.rajaongkir.com/v2/cost', {
      method: 'POST',
      headers: {
        'key': rajaongkirApiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    if (!response.ok) {
      console.error(`RajaOngkir API returned error: ${response.status} ${response.statusText}`);
      return Response.json(
        { error: `RajaOngkir API error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    if (result.rajaongkir.status.code !== 200) {
      console.error('RajaOngkir API returned error status:', result.rajaongkir.status);
      return Response.json(
        { 
          error: result.rajaongkir.status.description || 'RajaOngkir API error', 
          details: result.rajaongkir.status 
        },
        { status: 400 }
      );
    }

    // Return the shipping costs
    return Response.json({
      success: true,
      data: result.rajaongkir.results,
    });
  } catch (error) {
    console.error('Error in RajaOngkir shipping calculation API:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}