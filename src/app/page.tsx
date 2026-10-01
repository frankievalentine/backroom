'use client';

import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Navbar from '@/components/Navbar';
import ProductList from '@/components/ProductList';
import FilterSidebar from '@/components/FilterSidebar';
import { AlertCircle } from 'lucide-react';

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

interface Filters {
  vendors: string[];
  productTypes: string[];
  tags: string[];
  priceRanges: string[];
}

export default function Home() {
  const [websites, setWebsites] = useState<string[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState<string>('');
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchProducts = async (domain: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWebsiteChange = (website: string) => {
    setSelectedWebsite(website);
    if (website) {
      fetchProducts(website);
    } else {
      setProducts([]);
    }
  };

  const handleAddWebsite = (website: string) => {
    if (!websites.includes(website)) {
      setWebsites([...websites, website]);
    }
    setSelectedWebsite(website);
    fetchProducts(website);
  };

  const handleDeleteWebsite = (website: string) => {
    setWebsites(websites.filter(w => w !== website));
    if (selectedWebsite === website) {
      setSelectedWebsite('');
      setProducts([]);
      setFilteredProducts([]);
    }
  };

  const handleFiltersChange = (filters: Filters) => {
    let filtered = [...products];

    // Filter by vendors
    if (filters.vendors.length > 0) {
      filtered = filtered.filter((product) =>
        filters.vendors.includes(product.vendor)
      );
    }

    // Filter by product types
    if (filters.productTypes.length > 0) {
      filtered = filtered.filter((product) =>
        filters.productTypes.includes(product.product_type)
      );
    }

    // Filter by tags
    if (filters.tags.length > 0) {
      filtered = filtered.filter((product) => {
        if (!product.tags || typeof product.tags !== 'string') return false;
        const productTags = product.tags.split(',').map((tag) => tag.trim());
        return filters.tags.some((tag) => productTags.includes(tag));
      });
    }

    // Filter by price ranges
    if (filters.priceRanges.length > 0) {
      filtered = filtered.filter((product) => {
        return product.variants.some((variant) => {
          const price = parseFloat(variant.price);
          if (isNaN(price)) return false;

          return filters.priceRanges.some((rangeLabel) => {
            if (rangeLabel === 'Under $25') return price < 25;
            if (rangeLabel === '$25 - $50') return price >= 25 && price < 50;
            if (rangeLabel === '$50 - $100') return price >= 50 && price < 100;
            if (rangeLabel === '$100 - $200') return price >= 100 && price < 200;
            if (rangeLabel === 'Over $200') return price >= 200;
            return false;
          });
        });
      });
    }

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

return (
    <SidebarProvider defaultOpen={true}>
      <FilterSidebar
        products={products}
        onFiltersChange={handleFiltersChange}
      />
      
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
          <Navbar
            selectedWebsite={selectedWebsite}
            onWebsiteChange={handleWebsiteChange}
            onAddWebsite={handleAddWebsite}
            onDeleteWebsite={handleDeleteWebsite}
            websites={websites}
          />
          
          <main className="flex-1 p-6 2xl:p-8">
            <div className="max-w-7xl 2xl:max-w-screen-2xl mx-auto">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="mb-6">
                <h1 className="text-2xl font-bold">
                  {selectedWebsite ? `Products from ${selectedWebsite}` : 'Select a website to view products'}
                </h1>
                {selectedWebsite && (
                  <p className="text-muted-foreground mt-1">
                    Showing {filteredProducts.length} of {products.length} products
                  </p>
                )}
              </div>
              
              <ProductList
                products={filteredProducts}
                loading={loading}
                selectedWebsite={selectedWebsite}
              />
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}