// API route to fetch cities by province from RajaOngkir securely
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { provinceId } = await req.json();
    
    // Validate required param
    if (!provinceId) {
      return Response.json(
        { error: 'Missing required parameter: provinceId' },
        { status: 400 }
      );
    }

    // Ensure we have the API key
    const rajaongkirApiKey = process.env.NEXT_PUBLIC_RAJAONGKIR_API_KEY;
    if (!rajaongkirApiKey) {
      console.error('RajaOngkir API key is not set in environment variables');
      return Response.json(
        { error: 'Location data is temporarily unavailable' },
        { status: 500 }
      );
    }

    // Call RajaOngkir API
    const response = await fetch(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
      method: 'GET',
      headers: {
        'key': rajaongkirApiKey,
      },
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

    // Return the cities data
    return Response.json({
      success: true,
      data: result.rajaongkir.results,
    });
  } catch (error) {
    console.error('Error in RajaOngkir cities API:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}