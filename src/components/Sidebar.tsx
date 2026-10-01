'use client';

import { useState, useMemo } from 'react';

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

interface SidebarProps {
  products: ShopifyProduct[];
  onFiltersChange: (filters: {
    vendors: string[];
    productTypes: string[];
    tags: string[];
    priceRanges: string[];
  }) => void;
}

export default function Sidebar({ products, onFiltersChange }: SidebarProps) {
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

  const handleVendorChange = (vendor: string) => {
    const newVendors = selectedVendors.includes(vendor)
      ? selectedVendors.filter((v) => v !== vendor)
      : [...selectedVendors, vendor];
    
    setSelectedVendors(newVendors);
    updateFilters(newVendors, selectedProductTypes, selectedTags, selectedPriceRanges);
  };

  const handleProductTypeChange = (type: string) => {
    const newTypes = selectedProductTypes.includes(type)
      ? selectedProductTypes.filter((t) => t !== type)
      : [...selectedProductTypes, type];
    
    setSelectedProductTypes(newTypes);
    updateFilters(selectedVendors, newTypes, selectedTags, selectedPriceRanges);
  };

  const handleTagChange = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    updateFilters(selectedVendors, selectedProductTypes, newTags, selectedPriceRanges);
  };

  const handlePriceRangeChange = (rangeLabel: string) => {
    const newRanges = selectedPriceRanges.includes(rangeLabel)
      ? selectedPriceRanges.filter((r) => r !== rangeLabel)
      : [...selectedPriceRanges, rangeLabel];
    
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

  if (products.length === 0) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <p className="text-gray-500 text-sm">No products to filter</p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          type="button"
          onClick={clearAllFilters}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear all
        </button>
      </div>

      {filterOptions.vendors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Vendors</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filterOptions.vendors.map((vendor) => (
              <label key={vendor} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedVendors.includes(vendor)}
                  onChange={() => handleVendorChange(vendor)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{vendor}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {filterOptions.productTypes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Product Types</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filterOptions.productTypes.map((type) => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedProductTypes.includes(type)}
                  onChange={() => handleProductTypeChange(type)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {filterOptions.priceRanges.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Price Ranges</h3>
          <div className="space-y-2">
            {filterOptions.priceRanges.map((range) => (
              <label key={range.label} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedPriceRanges.includes(range.label)}
                  onChange={() => handlePriceRangeChange(range.label)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {filterOptions.tags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {filterOptions.tags.slice(0, 20).map((tag) => (
              <label key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag)}
                  onChange={() => handleTagChange(tag)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{tag}</span>
              </label>
            ))}
            {filterOptions.tags.length > 20 && (
              <p className="text-xs text-gray-500 mt-2">
                Showing 20 of {filterOptions.tags.length} tags
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}