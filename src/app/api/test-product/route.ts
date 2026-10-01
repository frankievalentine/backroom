import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'shop.polymer-project.org'; // Example Shopify store
    
    const response = await fetch(`https://${domain}/products.json?limit=2`);
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      products: data.products,
      sampleProduct: data.products?.[0] ? {
        id: data.products[0].id,
        title: data.products[0].title,
        has_image: !!data.products[0].image,
        has_images: !!data.products[0].images,
        has_images_array: Array.isArray(data.products[0].images),
        images_count: data.products[0].images?.length || 0,
        image_src: data.products[0].image?.src,
        first_image_src: data.products[0].images?.[0]?.src,
        full_image: data.products[0].image,
        full_images: data.products[0].images?.slice(0, 2)
      } : null
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}