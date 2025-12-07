'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  PawPrint, 
  ShoppingBag, 
  Bell, 
  Menu, 
  X, 
  Search,
  LogOut,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useCartItemCount } from '@/store/cart-store';
import { useNotificationStore } from '@/store/notification-store';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { useCategories } from '@/hooks/use-categories';

export function Header() {
  const router = useRouter();
  const { user, profile, signOut, isAdmin, isKasir, loading } = useAuth();
  const itemCount = useCartItemCount();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const { settings: storeSettings } = useStoreSettings();
  const { getActiveCategories } = useCategories();
  const categories = getActiveCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for Sheet component
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force a full page refresh to clear all state
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign out failed:', err);
      // Still redirect on error
      window.location.href = '/login';
    }
  };

  const getDashboardLink = () => {
    if (isAdmin) return '/admin';
    if (isKasir) return '/kasir';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brown-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {storeSettings?.storeLogo ? (
              <div className="relative w-8 h-8">
                {storeSettings.storeLogo.startsWith('data:') ? (
                  <img
                    src={storeSettings.storeLogo}
                    alt={storeSettings.storeName || 'Store Logo'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={storeSettings.storeLogo}
                    alt={storeSettings.storeName || 'Store Logo'}
                    fill
                    className="object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="p-1.5 bg-primary rounded-lg">
                <PawPrint className="h-6 w-6 text-white" />
              </div>
            )}
            <span className="font-bold text-xl text-brown-900 hidden sm:block">
              {storeSettings?.storeName || 'ShortTail.id'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm font-medium text-brown-700 hover:text-primary transition-colors"
            >
              All Products
            </Link>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="text-sm font-medium text-brown-700 hover:text-primary transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-sm mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-brown-50 border-brown-200"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag className="h-5 w-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {itemCount}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </Link>

            {/* Show nothing while loading to prevent flash */}
            {loading ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-brown-100 animate-pulse" />
              </div>
            ) : user ? (
              <>
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.user_avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-white">
                          {profile?.user_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{profile?.user_name || 'User'}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {profile?.tier} • {profile?.points_balance || 0} pts
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(getDashboardLink())}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.push('/login')}>
                  Sign in
                </Button>
                <Button onClick={() => router.push('/register')}>
                  Sign up
                </Button>
              </div>
            )}

            {/* Mobile Menu - Only render after mount to prevent hydration mismatch */}
            {mounted ? (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col gap-6 mt-6">
                    {/* Mobile Search */}
                    <form onSubmit={handleSearch}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </form>

                    {/* Mobile Nav Links */}
                    <nav className="flex flex-col gap-4">
                      <Link
                        href="/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-lg font-medium text-brown-700 hover:text-primary transition-colors"
                      >
                        All Products
                      </Link>
                      {categories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-lg font-medium text-brown-700 hover:text-primary transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </nav>

                    {!loading && !user && (
                      <div className="flex flex-col gap-2 mt-4">
                        <Button variant="outline" onClick={() => router.push('/login')}>
                          Sign in
                        </Button>
                        <Button onClick={() => router.push('/register')}>
                          Sign up
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
