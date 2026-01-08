// API route to fetch cities by province from RajaOngkir securely
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { provinceId } = await req.json();

    // Validate required param
    if (!provinceId) {
      console.log('Missing provinceId in request');
      return Response.json(
        { error: 'Missing required parameter: provinceId' },
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
        { error: 'RajaOngkir API key is not configured' },
        { status: 500 }
      );
    }

    console.log('Making request to RajaOngkir API with provinceId:', provinceId);

    // Call RajaOngkir API
    const response = await fetch(`https://api.rajaongkir.com/starter/city?province=${provinceId}`, {
      method: 'GET',
      headers: {
        'key': rajaongkirApiKey,
      },
    });

    console.log('RajaOngkir API response status:', response.status);
    
    // Get the response text first to see what the actual error is
    const responseBody = await response.text();
    console.log('Raw RajaOngkir API response:', responseBody);

    // Try parsing the response
    let result;
    try {
      result = JSON.parse(responseBody);
    } catch (e) {
      console.error('Could not parse RajaOngkir response as JSON:', e);
      console.error('Raw response was:', responseBody);
      return Response.json(
        { error: 'Invalid response from RajaOngkir API', rawResponse: responseBody },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error(`RajaOngkir API returned error: ${response.status} ${response.statusText}`);
      return Response.json(
        { 
          error: `RajaOngkir API error: ${response.status}`, 
          details: result || responseBody 
        },
        { status: response.status }
      );
    }

    if (result.rajaongkir && result.rajaongkir.status && result.rajaongkir.status.code !== 200) {
      console.error('RajaOngkir API returned error status:', result.rajaongkir.status);
      return Response.json(
        {
          error: result.rajaongkir.status.description || 'RajaOngkir API error',
          details: result.rajaongkir.status
        },
        { status: 400 }
      );
    }

    // Handle case where response format is different than expected
    if (!result.rajaongkir || !result.rajaongkir.results) {
      console.error('Unexpected RajaOngkir API response format:', result);
      return Response.json(
        { error: 'Unexpected response format from RajaOngkir API', details: result },
        { status: 500 }
      );
    }

    console.log('Successfully retrieved cities from RajaOngkir API');
    
    // Return the cities data
    return Response.json({
      success: true,
      data: result.rajaongkir.results,
    });
  } catch (error) {
    console.error('Error in RajaOngkir cities API:', error);
    return Response.json(
      { 
        error: 'Internal server error in RajaOngkir cities API', 
        message: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}