'use client';

import React, { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, Dog, Cat, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { ProductFilters } from '@/hooks/use-products-grid';
import { useCategories } from '@/hooks/use-categories';

interface FilterBarProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  totalResults?: number;
  className?: string;
}

const sortOptions = [
  { value: 'newest', label: 'Newest First', icon: null },
  { value: 'price-asc', label: 'Price: Low to High', icon: null },
  { value: 'price-desc', label: 'Price: High to Low', icon: null },
  { value: 'name-asc', label: 'Name: A to Z', icon: null },
  { value: 'popularity', label: 'Most Popular', icon: null },
];

const petTypes = [
  { value: 'all', label: 'All Pets', icon: null },
  { value: 'dog', label: 'Dogs', icon: Dog },
  { value: 'cat', label: 'Cats', icon: Cat },
];

export function FilterBar({
  filters,
  onFiltersChange,
  totalResults,
  className,
}: FilterBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');
  const { getActiveCategories } = useCategories();
  const categories = getActiveCategories();

  // Debounced search update
  const debouncedSearch = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, searchQuery: value });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    // Debounce the actual filter update
    setTimeout(() => debouncedSearch(value), 300);
  };

  const clearSearch = () => {
    setSearchInput('');
    onFiltersChange({ ...filters, searchQuery: '' });
  };

  const activeFiltersCount = [
    filters.category && filters.category !== 'all',
    filters.petType && filters.petType !== 'all',
    filters.minPrice !== undefined || filters.maxPrice !== undefined,
    filters.inStockOnly,
  ].filter(Boolean).length;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-10 pr-10"
            aria-label="Search products"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-between min-w-[140px]"
              aria-label="Select category"
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                {categories.find((c) => c.slug === filters.category)?.name || 'All Categories'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[200px]" align="start">
            <Command>
              <CommandInput placeholder="Search categories..." />
              <CommandList>
                <CommandEmpty>No categories found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onFiltersChange({ ...filters, category: 'all' })}
                    className={cn(
                      'cursor-pointer',
                      filters.category === 'all' && 'bg-accent/10'
                    )}
                  >
                    All Categories
                  </CommandItem>
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      onSelect={() => onFiltersChange({ ...filters, category: category.slug })}
                      className={cn(
                        'cursor-pointer',
                        filters.category === category.slug && 'bg-accent/10'
                      )}
                    >
                      {category.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Sort Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-between min-w-[140px]"
              aria-label="Sort products"
            >
              <span>
                {sortOptions.find((o) => o.value === filters.sortBy)?.label || 'Sort by'}
              </span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[180px]" align="end">
            <Command>
              <CommandList>
                <CommandGroup>
                  {sortOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() =>
                        onFiltersChange({ ...filters, sortBy: option.value as ProductFilters['sortBy'] })
                      }
                      className={cn(
                        'cursor-pointer',
                        filters.sortBy === option.value && 'bg-accent/10'
                      )}
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Advanced Filters Toggle */}
        <Button
          variant={activeFiltersCount > 0 ? 'default' : 'outline'}
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="relative"
          aria-label="Toggle advanced filters"
          aria-expanded={isAdvancedOpen}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters Panel */}
      {isAdvancedOpen && (
        <div className="bg-white border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pet Type Filter */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Pet Type</Label>
              <div className="flex gap-2">
                {petTypes.map((pet) => {
                  const Icon = pet.icon;
                  return (
                    <button
                      key={pet.value}
                      onClick={() =>
                        onFiltersChange({
                          ...filters,
                          petType: pet.value as ProductFilters['petType'],
                        })
                      }
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors',
                        filters.petType === pet.value
                          ? 'border-accent bg-accent/5 text-accent'
                          : 'border-brown-200 hover:border-accent/50'
                      )}
                      aria-pressed={filters.petType === pet.value}
                    >
                      {Icon && <Icon className="h-4 w-4" />}
                      <span className="text-sm">{pet.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Price Range: {formatPrice(filters.minPrice || 0)} -{' '}
                {formatPrice(filters.maxPrice || 1000000)}
              </Label>
              <Slider
                defaultValue={[filters.minPrice || 0, filters.maxPrice || 1000000]}
                max={1000000}
                step={10000}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    minPrice: value[0],
                    maxPrice: value[1],
                  })
                }
                className="mt-2"
              />
            </div>

            {/* Stock Filter */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">In Stock Only</Label>
                <p className="text-xs text-brown-500">Hide out of stock items</p>
              </div>
              <Switch
                checked={filters.inStockOnly || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, inStockOnly: checked })
                }
                aria-label="Show only in stock items"
              />
            </div>
          </div>

          <Separator />

          {/* Active Filters & Clear */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.category && filters.category !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find((c) => c.slug === filters.category)?.name}
                  <button
                    onClick={() => onFiltersChange({ ...filters, category: 'all' })}
                    className="ml-1 hover:text-destructive"
                    aria-label="Remove category filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.petType && filters.petType !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  {petTypes.find((p) => p.value === filters.petType)?.label}
                  <button
                    onClick={() => onFiltersChange({ ...filters, petType: 'all' })}
                    className="ml-1 hover:text-destructive"
                    aria-label="Remove pet type filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.inStockOnly && (
                <Badge variant="secondary" className="gap-1">
                  In Stock
                  <button
                    onClick={() => onFiltersChange({ ...filters, inStockOnly: false })}
                    className="ml-1 hover:text-destructive"
                    aria-label="Remove stock filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onFiltersChange({
                  category: 'all',
                  petType: 'all',
                  minPrice: undefined,
                  maxPrice: undefined,
                  inStockOnly: false,
                  searchQuery: '',
                  sortBy: 'newest',
                })
              }
              className="text-brown-500"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Results Count */}
      {totalResults !== undefined && (
        <p className="text-sm text-brown-500">
          Showing {totalResults.toLocaleString('id-ID')} products
        </p>
      )}
    </div>
  );
}
