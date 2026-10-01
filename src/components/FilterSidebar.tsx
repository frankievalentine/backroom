'use client';

import { useState, useMemo } from 'react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Filter, X, Building, Package, Tag, DollarSign } from 'lucide-react';

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

interface FilterOptions {
  vendors: string[];
  productTypes: string[];
  tags: string[];
  priceRanges: Array<{ min: number; max: number; label: string }>;
}

interface Filters {
  vendors: string[];
  productTypes: string[];
  tags: string[];
  priceRanges: string[];
}

interface FilterSidebarProps {
  products: ShopifyProduct[];
  onFiltersChange: (filters: Filters) => void;
}

export default function FilterSidebar({ products, onFiltersChange }: FilterSidebarProps) {
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedProductTypes, setSelectedProductTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);

  const filterOptions = useMemo(() => {
    const vendors = new Set<string>();
    const productTypes = new Set<string>();
    const tags = new Set<string>();
    const prices: number[] = [];

    products.forEach((product) => {
      if (product.vendor) vendors.add(product.vendor);
      if (product.product_type) productTypes.add(product.product_type);
      
      if (product.tags && typeof product.tags === 'string') {
        product.tags.split(',').forEach((tag) => {
          const trimmedTag = tag.trim();
          if (trimmedTag) tags.add(trimmedTag);
        });
      }

      product.variants.forEach((variant) => {
        const price = parseFloat(variant.price);
        if (!isNaN(price)) prices.push(price);
      });
    });

    const priceRanges = [
      { min: 0, max: 25, label: 'Under $25' },
      { min: 25, max: 50, label: '$25 - $50' },
      { min: 50, max: 100, label: '$50 - $100' },
      { min: 100, max: 200, label: '$100 - $200' },
      { min: 200, max: Infinity, label: 'Over $200' },
    ];

    return {
      vendors: Array.from(vendors).sort(),
      productTypes: Array.from(productTypes).sort(),
      tags: Array.from(tags).sort(),
      priceRanges,
    };
  }, [products]);

  const handleVendorChange = (vendor: string, checked: boolean) => {
    const newVendors = checked 
      ? [...selectedVendors, vendor]
      : selectedVendors.filter((v) => v !== vendor);
    
    setSelectedVendors(newVendors);
    updateFilters(newVendors, selectedProductTypes, selectedTags, selectedPriceRanges);
  };

  const handleProductTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...selectedProductTypes, type]
      : selectedProductTypes.filter((t) => t !== type);
    
    setSelectedProductTypes(newTypes);
    updateFilters(selectedVendors, newTypes, selectedTags, selectedPriceRanges);
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    const newTags = checked
      ? [...selectedTags, tag]
      : selectedTags.filter((t) => t !== tag);
    
    setSelectedTags(newTags);
    updateFilters(selectedVendors, selectedProductTypes, newTags, selectedPriceRanges);
  };

  const handlePriceRangeChange = (rangeLabel: string, checked: boolean) => {
    const newRanges = checked
      ? [...selectedPriceRanges, rangeLabel]
      : selectedPriceRanges.filter((r) => r !== rangeLabel);
    
    setSelectedPriceRanges(newRanges);
    updateFilters(selectedVendors, selectedProductTypes, selectedTags, newRanges);
  };

  const updateFilters = (
    vendors: string[],
    productTypes: string[],
    tags: string[],
    priceRanges: string[]
  ) => {
    onFiltersChange({
      vendors,
      productTypes,
      tags,
      priceRanges,
    });
  };

  const clearAllFilters = () => {
    setSelectedVendors([]);
    setSelectedProductTypes([]);
    setSelectedTags([]);
    setSelectedPriceRanges([]);
    onFiltersChange({
      vendors: [],
      productTypes: [],
      tags: [],
      priceRanges: [],
    });
  };

  const hasActiveFilters = selectedVendors.length > 0 || 
                          selectedProductTypes.length > 0 || 
                          selectedTags.length > 0 || 
                          selectedPriceRanges.length > 0;

  return (
    <Sidebar variant="inset" className="bg-sidebar border-sidebar-border">
      <SidebarHeader className="p-4 2xl:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold 2xl:text-xl text-gray-900 dark:text-gray-100">Filters</h2>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <ScrollArea className="flex-1 p-4 2xl:p-6">
          {products.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No products to filter
            </div>
          ) : (
            <div className="space-y-6">
              {filterOptions.vendors.length > 0 && (
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <Building className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <Label className="text-sm font-medium block 2xl:text-base text-gray-700 dark:text-gray-300">Vendors</Label>
                  </div>
                  <div className="space-y-2">
                    {filterOptions.vendors.map((vendor) => (
                      <div key={vendor} className="flex items-center space-x-2">
                        <Checkbox
                          id={`vendor-${vendor}`}
                          checked={selectedVendors.includes(vendor)}
                          onCheckedChange={(checked) => handleVendorChange(vendor, checked as boolean)}
                          className="p-2 mr-3 ml-2"
                        />
                        <Label 
                          htmlFor={`vendor-${vendor}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {vendor}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filterOptions.productTypes.length > 0 && (
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <Package className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <Label className="text-sm font-medium block 2xl:text-base text-gray-700 dark:text-gray-300">Product Types</Label>
                  </div>
                  <div className="space-y-2">
                    {filterOptions.productTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedProductTypes.includes(type)}
                          onCheckedChange={(checked) => handleProductTypeChange(type, checked as boolean)}
                          className="p-2 mr-3 ml-2"
                        />
                        <Label 
                          htmlFor={`type-${type}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filterOptions.priceRanges.length > 0 && (
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <DollarSign className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <Label className="text-sm font-medium block 2xl:text-base text-gray-700 dark:text-gray-300">Price Ranges</Label>
                  </div>
                  <div className="space-y-2">
                    {filterOptions.priceRanges.map((range) => (
                      <div key={range.label} className="flex items-center space-x-2">
                        <Checkbox
                          id={`price-${range.label}`}
                          checked={selectedPriceRanges.includes(range.label)}
                          onCheckedChange={(checked) => handlePriceRangeChange(range.label, checked as boolean)}
                          className="p-2 mr-3 ml-2"
                        />
                        <Label 
                          htmlFor={`price-${range.label}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {range.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {filterOptions.tags.length > 0 && (
                <div>
                  <div className="flex items-center space-x-3 mb-3">
                    <Tag className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
                    <Label className="text-sm font-medium block 2xl:text-base text-gray-700 dark:text-gray-300">Tags</Label>
                  </div>
                  <div className="space-y-2">
                    {filterOptions.tags.slice(0, 20).map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={(checked) => handleTagChange(tag, checked as boolean)}
                          className="p-2 mr-3 ml-2"
                        />
                        <Label 
                          htmlFor={`tag-${tag}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {tag}
                        </Label>
                      </div>
                    ))}
                    {filterOptions.tags.length > 20 && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Showing 20 of {filterOptions.tags.length} tags
                      </div>
                    )}
                  </div>
                </div>
              )}

              {hasActiveFilters && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Active Filters</Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedVendors.map((vendor) => (
                        <Badge key={vendor} variant="secondary" className="text-xs">
                          {vendor}
                        </Badge>
                      ))}
                      {selectedProductTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                      {selectedPriceRanges.map((range) => (
                        <Badge key={range} variant="secondary" className="text-xs">
                          {range}
                        </Badge>
                      ))}
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}