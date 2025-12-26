'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, Heart, ArrowRight, User, Percent, Tag, Calendar, Gift, Sparkles, Star } from 'lucide-react';
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
import { useActivePromotions } from '@/hooks/use-active-promotions';
import { getAvatarDataInfo } from '@/lib/utils';

// Navigation items
const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Shop', href: '/products' },
  { label: 'Sale', href: '/products?on_sale=true' },
  { label: 'New', href: '/products?new=true' },
  { label: 'Contact', href: '/#footer' },
];

export function Header() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const itemCount = useCartItemCount();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);

  // Get active promotions to display in the news ticker
  const { promotions, loading: promotionsLoading, error: promotionsError } = useActivePromotions();

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
        // Desktop focus
        setTimeout(() => desktopInputRef.current?.focus(), 100);
      } else if (window.innerWidth < 768 && mobileInputRef.current) {
        // Mobile focus
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
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
    setIsSearchOpen(false);
    setIsMobileMenuOpen(false);
    searchTriggerRef.current?.focus();
  };

  const toggleSearch = () => {
    const newState = !isSearchOpen;
    setIsSearchOpen(newState);
    if (newState) {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    if (newState) {
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Search Overlay (Full Screen) */}
      <div
        className={`fixed inset-0 bg-cream/95 backdrop-blur-2xl z-50 p-6 flex flex-col md:hidden transition-all duration-300 ${
          isSearchOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4 pointer-events-none'
        }`}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent border-b-2 border-teal/20 py-4 pr-12 text-2xl text-teal placeholder:text-teal/30 focus:outline-none focus:border-teal transition-colors"
             />
             <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 p-3 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors shadow-lg">
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
                        setSearchQuery(term);
                        // In real app, submit here
                      }}
                      className="px-4 py-2 bg-white rounded-full text-sm text-teal hover:bg-teal hover:text-white transition-colors border border-teal/10 shadow-sm"
                    >
                        {term}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Full-width News Ticker */}
      <div className="sticky top-0 z-40 w-full transition-all duration-300 pointer-events-none">
        <div className="w-full" style={{ backgroundColor: '#006d77', color: '#fdf6ec' }}>
          {/* News Ticker with Active Promotions - Full width */}
          <div className="text-xs py-1.5 font-medium tracking-wide relative z-40 overflow-hidden">
            <div className="whitespace-nowrap hover:[animation-play-state:paused] w-max marquee-slow">
              {promotions.length > 0 ? (
                <span className="flex items-center gap-2">
                  {promotions.map((promo, index) => (
                    <React.Fragment key={promo.id}>
                      <span className="flex items-center gap-2">
                        {/* Icon based on promotion type */}
                        {promo.discount_type === 'percentage' ? (
                          <Percent className="w-4 h-4 inline" />
                        ) : promo.discount_type === 'fixed' ? (
                          <Tag className="w-4 h-4 inline" />
                        ) : (
                          <Gift className="w-4 h-4 inline" />
                        )}

                        {/* Promotion details */}
                        <span className="font-bold">{promo.code}</span>
                        <span>-</span>
                        <span>{promo.formattedDiscount}</span>
                        {promo.min_purchase_amount && (
                          <span>(Min. {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0
                          }).format(promo.min_purchase_amount)})</span>
                        )}
                        <span>until</span>
                        <span className="font-medium">{new Date(promo.end_date!).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short'
                        })}</span>
                        {promo.description && (
                          <>
                            <span>-</span>
                            <span>{promo.description}</span>
                          </>
                        )}
                      </span>
                      {index < promotions.length - 1 ? (
                        <span>⭐</span>
                      ) : null}
                    </React.Fragment>
                  ))}
                  <span>⭐</span>
                  <span>
                    <Sparkles className="w-4 h-4 inline" />
                    ✨ Welcome to ShortTail.id - Healthy Treats for every Anabul! ✨
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 inline" />
                  ✨ Welcome to ShortTail.id - Healthy Treats for every Anabul! ✨
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header Content - constrained to max-w-7xl */}
      <div className="sticky top-0 z-40 px-4 flex justify-center w-full transition-all duration-300 pointer-events-none">
        <div className="w-full max-w-7xl">
          <header
            className={`w-full pointer-events-auto transition-all duration-500 rounded-full border -mt-0.5 ${
              isScrolled
                ? 'bg-white/70 backdrop-blur-xl shadow-lg border-white/40 py-2'
                : 'bg-white/40 backdrop-blur-md border-white/20 py-3 shadow-sm'
            }`}
          >
            <div className="px-6 sm:px-8">
              <div className="flex items-center justify-between h-10">
              {/* Logo */}
              <div className={`flex-shrink-0 flex items-center gap-2 cursor-pointer group transition-all duration-300 ${isSearchOpen ? 'md:w-0 md:opacity-0 md:overflow-hidden' : 'opacity-100'}`}>
                <Link href="/" className="text-2xl font-bold text-teal tracking-tighter group-hover:scale-105 transition-transform whitespace-nowrap">
                  ShortTail<span className="text-accent">.id</span>
                </Link>
              </div>

              {/* Desktop Nav - Hides when search is open */}
              {!isSearchOpen && (
                <nav className="hidden md:flex items-center gap-8" aria-label="Main Navigation">
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-teal font-medium hover:text-accent transition-colors text-sm uppercase tracking-wide relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all after:duration-300 hover:after:w-full focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-sm"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              )}

              {/* Desktop Search Input (Expandable) */}
              {isSearchOpen && (
                <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-3xl mx-4 relative animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    ref={desktopInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products, categories, or brands..."
                    className="w-full bg-white/50 border border-teal/20 rounded-full py-2 pl-10 pr-12 text-teal placeholder:text-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/50 focus:bg-white/80 transition-all text-sm"
                  />
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal/50" />
                  <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-accent rounded-full text-white hover:bg-accent-hover transition-colors">
                    <ArrowRight size={14} />
                  </button>
                </form>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  ref={searchTriggerRef}
                  onClick={toggleSearch}
                  className={`p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal ${isSearchOpen ? 'bg-teal/10 text-accent' : ''}`}
                  aria-label={isSearchOpen ? "Close Search" : "Open Search"}
                  aria-expanded={isSearchOpen}
                >
                  {isSearchOpen ? <X size={20} /> : <Search size={20} />}
                </button>

                {/* Hide Wishlist when search is open to reduce clutter on desktop */}
                {!isSearchOpen && user && (
                  <Link
                    href="/dashboard/wishlist"
                    className="hidden sm:block p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal"
                    aria-label="Wishlist"
                  >
                    <Heart size={20} />
                  </Link>
                )}

                <Link
                  href="/cart"
                  className="relative p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all cursor-pointer focus-within:ring-2 focus-within:ring-teal"
                  aria-label={`Shopping Cart, ${itemCount} items`}
                >
                  <ShoppingCart size={20} />
                  {itemCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-accent text-white text-[10px] flex items-center justify-center rounded-full font-bold animate-pulse ring-2 ring-white">
                      {itemCount}
                    </span>
                  )}
                </Link>

                {/* User Profile/Logout - Hides when search is open */}
                {!isSearchOpen && (
                  <>
                    {user ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="flex items-center gap-2 px-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={profile?.user_avatar_url && getAvatarDataInfo(profile.user_avatar_url).isValid ? profile.user_avatar_url : undefined} 
                                onError={(e) => {
                                  console.error('Header avatar image failed to load:', profile?.user_avatar_url);
                                }}
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
                          <DropdownMenuItem 
                            onClick={async () => {
                              try {
                                await signOut();
                              } catch (error) {
                                console.error('Error during logout:', error);
                              }
                            }}
                            className="text-red-600 focus:text-red-700"
                          >
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-log-out mr-2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" x2="9" y1="12" y2="12"></line>
                              </svg>
                              Logout
                            </span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Link href="/login" className="hidden sm:block p-2 text-teal hover:text-accent hover:bg-teal/5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-teal">
                        <User size={20} />
                      </Link>
                    )}
                  </>
                )}

                {/* Mobile Menu Button */}
                <button
                  className={`md:hidden p-2 text-teal hover:bg-teal/5 rounded-full focus:outline-none focus:ring-2 focus:ring-teal ${isSearchOpen ? 'hidden' : 'block'}`}
                  onClick={toggleMobileMenu}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open mobile menu"}
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          <div
            id="mobile-menu"
            className={`
              absolute top-full left-0 right-0 mt-2 mx-2
              bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50
              overflow-hidden transition-all duration-300 origin-top
              ${isMobileMenuOpen ? 'max-h-96 opacity-100 py-6 visible' : 'max-h-0 opacity-0 py-0 invisible'}
            `}
            aria-hidden={!isMobileMenuOpen}
          >
               <div className="flex flex-col gap-2 px-6">
                {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="text-teal font-bold text-lg hover:text-accent hover:pl-2 transition-all focus:outline-none focus:text-accent focus:pl-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                      tabIndex={isMobileMenuOpen ? 0 : -1}
                    >
                      {item.label}
                    </Link>
                  ))}
                  <div className="h-px bg-teal/10 my-2"></div>
                  <div className="flex gap-4">
                    {user ? (
                      <>
                        <Link href="/dashboard">
                          <Button variant="outline" size="sm" className="flex-1 justify-center" tabIndex={isMobileMenuOpen ? 0 : -1}>
                            Dashboard
                          </Button>
                        </Link>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1 justify-center" 
                          tabIndex={isMobileMenuOpen ? 0 : -1}
                          onClick={async (e) => {
                            e.preventDefault();
                            try {
                              await signOut();
                              // The middleware will handle redirecting to login
                            } catch (error) {
                              console.error('Error during logout:', error);
                            }
                          }}
                        >
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link href="/login">
                          <Button variant="outline" size="sm" className="flex-1 justify-center" tabIndex={isMobileMenuOpen ? 0 : -1}>
                            Log In
                          </Button>
                        </Link>
                        <Link href="/register">
                          <Button variant="default" size="sm" className="flex-1 justify-center" tabIndex={isMobileMenuOpen ? 0 : -1}>
                            Sign Up
                          </Button>
                        </Link>
                      </>
                    )}
                  </div> {/* Close the flex flex-col gap-2 px-6 div inside mobile menu */}
               </div> {/* Close the mobile menu dropdown container */}
          </div> {/* Close the flex items-center justify-between h-10 div */}
        </div> {/* Close the px-6 sm:px-8 div */}
      </header> {/* Close the header element */}
    </div> {/* Close the max-w-7xl div */}
  </div> {/* Close the main header content container (px-4 flex justify-center w-full) */}
</div> {/* Close the news ticker content div */}
</div> {/* Close the full-width news ticker container */}
    </>
  );
}