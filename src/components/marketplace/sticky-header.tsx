'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, X, Heart, ArrowRight, User, Store } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCartItemCount } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { EnhancedSignOutButton } from '@/components/ui/enhanced-signout-button';
import { cn } from '@/lib/utils';

interface StickyHeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export function StickyHeader({ onSearch, searchQuery = '' }: StickyHeaderProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const itemCount = useCartItemCount();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Manage focus when search state changes
  useEffect(() => {
    if (isSearchOpen) {
      if (window.innerWidth >= 768 && desktopInputRef.current) {
        setTimeout(() => desktopInputRef.current?.focus(), 100);
      } else if (window.innerWidth < 768 && mobileInputRef.current) {
        setTimeout(() => mobileInputRef.current?.focus(), 100);
      }
    }
  }, [isSearchOpen]);

  // Handle Escape key to close search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(false);
        searchTriggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      onSearch?.(localSearchQuery);
      router.push(`/products?search=${encodeURIComponent(localSearchQuery)}`);
    }
    setIsSearchOpen(false);
    searchTriggerRef.current?.focus();
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <>
      {/* Mobile Search Overlay (Full Screen) */}
      <div
        className={cn(
          'fixed inset-0 bg-cream/95 backdrop-blur-2xl z-50 p-6 flex flex-col md:hidden transition-all duration-300',
          isSearchOpen 
            ? 'opacity-100 visible translate-y-0' 
            : 'opacity-0 invisible -translate-y-4 pointer-events-none'
        )}
      >
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-2xl font-bold text-teal tracking-tighter">
            ShortTail<span className="text-accent">.id</span>
          </Link>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-2 bg-white/50 rounded-full text-teal hover:bg-white transition-colors shadow-sm"
            aria-label="Close search"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full mb-8">
          <input
            ref={mobileInputRef}
            type="text"
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full bg-transparent border-b-2 border-teal/20 py-4 pr-12 text-2xl text-teal placeholder:text-teal/30 focus:outline-none focus:border-teal transition-colors"
          />
          <button 
            type="submit" 
            className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors shadow-lg"
          >
            <ArrowRight size={20} />
          </button>
        </form>

        <div className="flex-1 overflow-y-auto">
          <p className="text-sm font-bold text-teal/50 uppercase tracking-wider mb-4">Popular Searches</p>
          <div className="flex flex-wrap gap-2">
            {['Premium Dog Food', 'Cat Toys', 'Bird Cage', 'Aquarium Filters', 'Dog Bed', 'Catnip'].map(term => (
              <button
                key={term}
                onClick={(e) => {
                  e.preventDefault();
                  setLocalSearchQuery(term);
                  onSearch?.(term);
                }}
                className="px-4 py-2 bg-white rounded-full text-sm text-teal hover:bg-teal hover:text-white transition-colors border border-teal/10 shadow-sm"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Header Content - constrained to max-w-7xl */}
      <div className="sticky top-0 z-40 px-4 flex justify-center w-full">
        <div className="w-full max-w-7xl">
          <header
            className={cn(
              'w-full pointer-events-auto rounded-full border transition-all duration-300',
              isScrolled
                ? 'bg-white/70 backdrop-blur-xl shadow-lg border-white/40 py-2'
                : 'bg-white/40 backdrop-blur-md border-white/20 py-3 shadow-sm'
            )}
          >
            <div className="px-6 sm:px-8">
              <div className="flex items-center justify-between h-10">
                {/* Logo */}
                <div className={cn(
                  'flex-shrink-0 flex items-center gap-2 cursor-pointer group transition-all duration-300',
                  isSearchOpen ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'opacity-100'
                )}>
                  <Link 
                    href="/" 
                    className="text-2xl font-bold text-teal tracking-tighter group-hover:scale-105 transition-transform whitespace-nowrap"
                  >
                    ShortTail<span className="text-accent">.id</span>
                  </Link>
                </div>

                {/* Desktop Search Input (Expandable) */}
                {isSearchOpen && (
                  <form 
                    onSubmit={handleSearchSubmit} 
                    className="hidden md:flex flex-1 max-w-3xl mx-4 relative animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <input
                      ref={desktopInputRef}
                      type="text"
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      placeholder="Search for products, categories, or brands..."
                      className="w-full bg-white/50 border border-teal/20 rounded-full py-2 pl-10 pr-12 text-teal placeholder:text-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/50 focus:bg-white/80 transition-all text-sm"
                    />
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/50" />
                    <button 
                      type="submit" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-accent rounded-full text-white hover:bg-accent-hover transition-colors"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </form>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <button
                    ref={searchTriggerRef}
                    onClick={toggleSearch}
                    className={cn(
                      'p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal',
                      isSearchOpen && 'bg-teal/10 text-accent'
                    )}
                    aria-label={isSearchOpen ? "Close Search" : "Open Search"}
                    aria-expanded={isSearchOpen}
                  >
                    {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                  </button>

                  {/* Hide Wishlist when search is open */}
                  {!isSearchOpen && user && (
                    <Link
                      href="/dashboard/wishlist"
                      className="hidden sm:block p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal"
                      aria-label="Wishlist"
                    >
                      <Heart size={20} />
                    </Link>
                  )}

                  {user ? (
                    <Link
                      href="/cart"
                      className="relative p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all cursor-pointer focus-within:ring-2 focus-within:ring-teal"
                      aria-label={`Shopping Cart, ${itemCount} items`}
                    >
                      <ShoppingCart size={20} />
                      {itemCount > 0 && (
                        <span className="absolute top-0 right-0 h-4 w-4 bg-accent text-white text-[10px] flex items-center justify-center rounded-full font-bold animate-pulse ring-2 ring-white">
                          {itemCount > 99 ? '99+' : itemCount}
                        </span>
                      )}
                    </Link>
                  ) : (
                    <Link
                      href="/about"
                      className="p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal"
                      aria-label="About"
                    >
                      <Store size={20} />
                    </Link>
                  )}

                  {/* User Profile - Hides when search is open */}
                  {!isSearchOpen && (
                    <>
                      {user ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 px-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={profile?.user_avatar_url || undefined}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-primary text-white text-sm">
                                  {profile?.user_name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900">
                                  {profile?.user_name || 'My Account'}
                                </p>
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href="/dashboard">
                                <User className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href="/dashboard/settings">
                                <User className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <div className="w-full">
                                <EnhancedSignOutButton
                                  variant="ghost"
                                  className="w-full justify-start text-red-600 focus:text-red-700"
                                  showSuccessToast={true}
                                  showErrorToast={true}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Sign Out
                                </EnhancedSignOutButton>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Link 
                          href="/login" 
                          className="hidden sm:block p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal"
                        >
                          <User size={20} />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>
        </div>
      </div>
    </>
  );
}
