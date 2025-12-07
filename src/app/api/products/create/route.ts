import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productData, variants } = body;

    // Insert product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (productError) {
      console.error('Product insert error:', productError);
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    // Handle variants
    if (productData.has_variants && variants && variants.length > 0) {
      // Insert variants one by one
      for (const variant of variants) {
        const { error: insertError } = await supabase
          .from('product_variants')
          .insert({
            variant_name: variant.variant_name.trim(),
            sku: variant.sku && variant.sku.trim() ? variant.sku.trim() : null,
            price_adjustment: variant.price,
            stock_quantity: variant.stock_quantity,
            weight_grams: variant.weight_grams || 0,
            product_id: product.id,
          });

        if (insertError) {
          console.error('Insert variant error:', insertError);
          return NextResponse.json({ error: `Failed to save variant: ${insertError.message}` }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
