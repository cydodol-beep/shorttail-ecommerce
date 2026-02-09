// API route to handle RajaOngkir shipping calculations securely
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getOriginCityId } from '@/lib/shipping/config';

export async function POST(req: NextRequest) {
  try {
    console.log('🔵 RajaOngkir API route called');
    const body = await req.json();
    const { destinationCityId, weight, courier } = body;
    
    console.log('📥 Request body:', { destinationCityId, weight, courier });
    
    // Validate required params
    if (!destinationCityId || !weight || !courier) {
      console.error('❌ Missing parameters:', { destinationCityId, weight, courier });
      return Response.json(
        { error: 'Missing required parameters: destinationCityId, weight, courier' },
        { status: 400 }
      );
    }

    // Ensure we have the API key (try both public and private variables)
    const rajaongkirApiKey = process.env.RAJAONGKIR_API_KEY || process.env.NEXT_PUBLIC_RAJAONGKIR_API_KEY;
    console.log('🔑 API Key check:', {
      hasKey: !!rajaongkirApiKey,
      keyLength: rajaongkirApiKey?.length || 0
    });
    
    if (!rajaongkirApiKey) {
      console.error('❌ RajaOngkir API key is not set in environment variables');
      console.error('Available env vars (partial):', {
        hasRajaongkirApiKey: !!process.env.RAJAONGKIR_API_KEY,
        hasNextPublicRajaongkirApiKey: !!process.env.NEXT_PUBLIC_RAJAONGKIR_API_KEY,
      });
      return Response.json(
        { error: 'Shipping calculation is temporarily unavailable - No API key' },
        { status: 500 }
      );
    }

    // Get origin city ID from store settings
    console.log('📍 Fetching origin city ID...');
    const originCityId = await getOriginCityId();
    console.log('📍 Origin city ID:', originCityId);
    
    if (!originCityId) {
      console.error('❌ Could not determine origin city ID for shipping calculation');
      return Response.json(
        { error: 'Unable to determine shipping origin' },
        { status: 500 }
      );
    }

    // Prepare data for RajaOngkir API
    const finalWeight = Math.ceil(Number(weight));
    const requestBody = new URLSearchParams({
      origin: originCityId,
      destination: destinationCityId,
      weight: finalWeight.toString(),
      courier: courier.toLowerCase(),
    });

    // Log request details for debugging
    console.log('🚚 RajaOngkir API Request:', {
      origin: originCityId,
      destination: destinationCityId,
      weight: finalWeight,
      weightInKg: (finalWeight / 1000).toFixed(2),
      courier: courier.toLowerCase()
    });

    // Call RajaOngkir API - using Komerce V2 endpoint (District Calculate Cost)
    console.log('🌐 Calling RajaOngkir API...');
    console.log('🌐 URL: https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost');
    console.log('🌐 Body:', requestBody.toString());
    
    const response = await fetch('https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost', {
      method: 'POST',
      headers: {
        'key': rajaongkirApiKey,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    console.log('📡 RajaOngkir Response Status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ RajaOngkir API returned error: ${response.status} ${response.statusText}`);
      console.error('❌ Error body:', errorText);
      return Response.json(
        { error: `RajaOngkir API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('📦 RajaOngkir Raw Response:', JSON.stringify(result, null, 2));

    // Check for Komerce V2 structure
    if (result.meta && result.meta.code === 200) {
      // Log response for debugging
      console.log('✅ RajaOngkir API Response:', {
        courier: courier,
        weight: finalWeight,
        servicesCount: result.data?.[0]?.costs?.length || 0,
        costs: result.data?.[0]?.costs?.map((c: any) => ({
          service: c.service,
          price: c.cost?.[0]?.value,
          etd: c.cost?.[0]?.etd
        }))
      });
      
      return Response.json({
        success: true,
        data: result.data,
      });
    }

    // Check implementation for Legacy structure
    if (result.rajaongkir && result.rajaongkir.status.code !== 200) {
      console.error('RajaOngkir API returned error status:', result.rajaongkir.status);
      return Response.json(
        { 
          error: result.rajaongkir.status.description || 'RajaOngkir API error', 
          details: result.rajaongkir.status 
        },
        { status: 400 }
      );
    } else if (result.rajaongkir && result.rajaongkir.results) {
        return Response.json({
        success: true,
        data: result.rajaongkir.results,
      });
    }

    return Response.json(
      { 
        error: result.meta?.message || 'RajaOngkir API error',
        details: result 
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('💥 Exception in RajaOngkir shipping calculation API:');
    console.error('💥 Error:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('💥 Error message:', error instanceof Error ? error.message : String(error));
    return Response.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}