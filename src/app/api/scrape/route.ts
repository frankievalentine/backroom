import { NextRequest, NextResponse } from 'next/server';
import { detectWebsiteType, fetchShopifyProducts, fetchGenericProducts } from '@/lib/website-detector';

const apiCache = new Map<string, { data: any[]; timestamp: number; websiteType: string }>();
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json();

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Clean domain (remove protocol, www, etc.)
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');

    // Check cache first
    const cacheKey = `products-${cleanDomain}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < API_CACHE_DURATION) {
      return NextResponse.json({
        domain: cleanDomain,
        products: cached.data,
        count: cached.data.length,
        websiteType: cached.websiteType
      });
    }

    // Detect website type
    const websiteType = await detectWebsiteType(cleanDomain);
    
    let products: any[] = [];
    
    if (websiteType === 'shopify') {
      products = await fetchShopifyProducts(cleanDomain);
    } else {
      products = await fetchGenericProducts(cleanDomain);
    }

    // Cache the results
    apiCache.set(cacheKey, { 
      data: products, 
      timestamp: Date.now(), 
      websiteType 
    });

    return NextResponse.json({
      domain: cleanDomain,
      products,
      count: products.length,
      websiteType
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}