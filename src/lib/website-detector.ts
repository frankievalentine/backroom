export async function detectWebsiteType(domain: string): Promise<'shopify' | 'unknown'> {
  try {
    // Check for Shopify-specific indicators
    const shopifyIndicators = [
      '/products.json',
      '/collections.json',
      '/cart.js',
      'cdn.shopify.com',
      'Shopify.theme'
    ];

    // First try the products.json endpoint (most reliable)
    const productsUrl = `https://${domain}/products.json?limit=1`;
    const productsResponse = await fetch(productsUrl, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (productsResponse.ok) {
      return 'shopify';
    }

    // Check for Shopify in HTML content
    const homeUrl = `https://${domain}`;
    const homeResponse = await fetch(homeUrl, { 
      signal: AbortSignal.timeout(5000) 
    });

    if (homeResponse.ok) {
      const html = await homeResponse.text();
      
      // Look for Shopify-specific patterns in HTML
      const shopifyPatterns = [
        /cdn\.shopify\.com/i,
        /Shopify\.theme/i,
        /shopify/i,
        /var Shopify =/i,
        /window\.Shopify/i,
        /Shopify\.Analytics/i
      ];

      for (const pattern of shopifyPatterns) {
        if (pattern.test(html)) {
          return 'shopify';
        }
      }
    }

    return 'unknown';
  } catch (error) {
    console.error(`Error detecting website type for ${domain}:`, error);
    return 'unknown';
  }
}

const cache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchShopifyProducts(domain: string): Promise<any[]> {
  const cacheKey = `shopify-${domain}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const allProducts: any[] = [];
  let page = 0;
  const limit = 250;
  let hasMore = true;

  while (hasMore) {
    try {
      const url = `https://${domain}/products.json?limit=${limit}&page=${page}`;
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(10000) // 10 second timeout per request
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const products = data.products || [];

      if (products.length === 0) {
        hasMore = false;
      } else {
        allProducts.push(...products);
        page++;
        
        // If we got fewer products than the limit, we've reached the end
        if (products.length < limit) {
          hasMore = false;
        }
      }
    } catch (error) {
      console.error(`Error fetching page ${page} for ${domain}:`, error);
      hasMore = false;
    }
  }

  cache.set(cacheKey, { data: allProducts, timestamp: Date.now() });
  return allProducts;
}

export async function fetchGenericProducts(domain: string): Promise<any[]> {
  // Placeholder for future generic scraping implementation
  // For now, return empty array
  console.log(`Generic scraping not implemented for ${domain}`);
  return [];
}