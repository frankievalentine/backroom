'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageOff } from 'lucide-react';

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  tags: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string;
    compare_at_price: string | null;
  }>;
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
    width: number;
    height: number;
  }>;
  image: {
    id: number;
    src: string;
    alt: string | null;
    width: number;
    height: number;
  };
}

interface ProductListProps {
  products: ShopifyProduct[];
  loading: boolean;
  selectedWebsite: string;
}

export default function ProductList({ products, loading, selectedWebsite }: ProductListProps) {
  if (loading) {
    return (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={`skeleton-loading-${Date.now()}-${i}`} className="flex flex-col">
            <Skeleton className="aspect-square w-full" />
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-lg font-medium text-muted-foreground">No products found</div>
        <div className="text-sm text-muted-foreground mt-2">Try selecting a different website or adding a new one</div>
      </div>
    );
  }

  // Debug: Log first product structure
  if (products.length > 0) {
    const firstProduct = products[0];
    console.log('First product structure:', {
      id: firstProduct.id,
      title: firstProduct.title,
      has_image: !!firstProduct.image,
      has_images: !!firstProduct.images,
      images_count: firstProduct.images?.length || 0,
      image_src: firstProduct.image?.src,
      first_image_src: firstProduct.images?.[0]?.src,
    });
  }

return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
       {products.map((product, index) => {
        // Try multiple image sources in order of preference
        const getImageSource = () => {
          const sources = [
            // Primary sources from API
            product.images?.[0]?.src,
            product.image?.src,
            product.featured_image,
            // Alternative Shopify image patterns
            product.id && product.handle && `https://cdn.shopify.com/s/files/1/0000/0000/products/${product.handle}.jpg`,
            product.id && `https://cdn.shopify.com/s/files/1/0000/0000/products/${product.id}.jpg`,
            // Fallback with common Shopify pattern
            product.handle && `https://cdn.shopify.com/s/files/1/0000/0000/files/${product.handle}.png`
          ].filter(Boolean);
          
          return sources[0] || null;
        };

        const imageSrc = getImageSource();

        return (
          <Card 
            key={`${product.id}-${index}`} 
            className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white dark:bg-card border-2 border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 cursor-pointer"
            onClick={() => {
              // Construct product URL from available data
              const productUrl = product.handle 
                ? `https://${selectedWebsite}/products/${product.handle}` 
                : product.handle 
                  ? `https://${selectedWebsite}/${product.handle}` 
                  : '#';
              
              window.open(productUrl, '_blank');
            }}
          >
            <div className="aspect-square relative bg-muted overflow-hidden">
              {imageSrc ? (
                <>
                  <img
                    src={imageSrc}
                    alt={product.title || 'Product image'}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.fallback-image');
                      if (fallback) {
                        fallback.classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center fallback-image hidden">
                    <ImageOff className="w-8 h-8 text-muted-foreground" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageOff className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
            
<CardHeader className="pb-2">
            <CardTitle className="line-clamp-2 text-sm 2xl:text-base text-gray-900 dark:text-gray-100 font-medium">{product.title}</CardTitle>
            <CardDescription className="text-xs">
              {product.vendor} • {product.product_type}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1">
            {product.variants.length > 0 && (
              <div className="text-lg font-semibold text-green-700 dark:text-green-400 2xl:text-xl">
                ${product.variants[0].price}
                {product.variants[0].compare_at_price && (
                  <span className="text-sm text-muted-foreground line-through ml-2">
                    ${product.variants[0].compare_at_price}
                  </span>
                )}
              </div>
            )}
          </CardContent>
            
            {product.tags && typeof product.tags === 'string' && (
              <CardFooter className="pt-0">
                <div className="flex flex-wrap gap-1">
                  {(product.tags.split(',')).slice(0, 3).map((tag, tagIndex) => (
                    <Badge key={`${product.id}-${tag.trim()}-${tagIndex}`} variant="secondary" className="text-xs">
                      {tag.trim()}
                    </Badge>
                  ))}
{product.tags.split(',').length > 3 && (
                  <Badge key={`${product.id}-more-tags`} variant="outline" className="text-xs">
                    +{product.tags.split(',').length - 3}
                  </Badge>
                )}
                </div>
              </CardFooter>
            )}
          </Card>
        );
      })}
    </div>
  );
}