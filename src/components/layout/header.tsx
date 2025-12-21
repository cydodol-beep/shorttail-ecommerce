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
import { useNotifications } from '@/hooks/use-notifications';

export function Header() {
  const router = useRouter();
  const { user, profile, signOut, isAdmin, isKasir, isSuperUser, loading } = useAuth();
  const itemCount = useCartItemCount();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();
  const { settings: storeSettings } = useStoreSettings();
  const { getActiveCategories } = useCategories();
  const categories = getActiveCategories();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Initialize the notification system for the header
  useNotifications();

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

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    await markAllAsRead();
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
              <div className="relative w-10 h-10">
                {storeSettings.storeLogo.startsWith('data:') ? (
                  <img
                    src={storeSettings.storeLogo}
                    alt={storeSettings.storeName || 'Store Logo'}
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <Image
                    src={storeSettings.storeLogo}
                    alt={storeSettings.storeName || 'Store Logo'}
                    fill
                    className="object-contain rounded-lg"
                  />
                )}
              </div>
            ) : (
              <div className="p-2 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-sm">
                <PawPrint className="h-6 w-6 text-primary-foreground" />
              </div>
            )}
            <span className="font-bold text-2xl text-brown-900 hidden sm:block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {storeSettings?.storeName || 'ShortTail.id'}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/products"
              className="text-sm font-semibold text-brown-700 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-brown-50"
            >
              All Products
            </Link>
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className="text-sm font-semibold text-brown-700 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-brown-50"
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
                className="pl-10 bg-brown-50 border-brown-200 focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-brown-50">
                <ShoppingBag className="h-5 w-5 text-brown-700" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
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
                    <Button variant="ghost" size="icon" className="relative rounded-lg hover:bg-brown-50">
                      <Bell className="h-5 w-5 text-brown-700" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto border-brown-200 bg-popover">
                    <DropdownMenuLabel className="text-brown-900">Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-brown-200" />
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-brown-100">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-3 hover:bg-brown-50 cursor-pointer transition-colors rounded-lg mx-1 ${
                              !notification.is_read ? 'bg-brown-50' : ''
                            }`}
                            onClick={async () => {
                              if (!notification.is_read) {
                                await handleMarkAsRead(notification.id);
                              }
                              if (notification.action_link) {
                                router.push(notification.action_link);
                              }
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className={`text-sm font-medium ${!notification.is_read ? 'font-semibold text-primary' : 'text-brown-900'}`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <span className="ml-2 flex-shrink-0">
                                  <span className="h-2 w-2 rounded-full bg-primary block"></span>
                                </span>
                              )}
                            </div>
                            <p className={`text-xs mt-1 ${!notification.is_read ? 'text-brown-700' : 'text-brown-500'}`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notification.created_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications
                      </div>
                    )}
                    {notifications.length > 0 && (
                      <>
                        <DropdownMenuSeparator className="bg-brown-200" />
                        <DropdownMenuItem
                          className="text-center cursor-pointer text-brown-700 hover:bg-brown-50 hover:text-primary"
                          onClick={handleMarkAllAsRead}
                        >
                          Mark all as read
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full p-0.5 hover:bg-brown-50">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={profile?.user_avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                          {profile?.user_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-brown-200 bg-popover">
                    <DropdownMenuLabel className="text-brown-900">
                      <div className="flex flex-col">
                        <span className="font-semibold">{profile?.user_name || 'User'}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {profile?.tier} • {profile?.points_balance || 0} pts
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-brown-200" />
                    <DropdownMenuItem
                      className="cursor-pointer text-brown-700 hover:bg-brown-50 hover:text-primary"
                      onClick={() => router.push(getDashboardLink())}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-brown-700 hover:bg-brown-50 hover:text-primary"
                      onClick={() => router.push('/game')}
                    >
                      <PawPrint className="mr-2 h-4 w-4" />
                      Play Game
                    </DropdownMenuItem>
                    {isSuperUser && (
                      <DropdownMenuItem
                        className="cursor-pointer text-brown-700 hover:bg-brown-50 hover:text-primary"
                        onClick={() => router.push('/kasir')}
                      >
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        POS System
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="cursor-pointer text-brown-700 hover:bg-brown-50 hover:text-primary"
                      onClick={() => router.push('/dashboard/settings')}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-brown-200" />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={handleSignOut}
                    >
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
                    <nav className="flex flex-col gap-2">
                      <Link
                        href="/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-base font-medium text-brown-700 hover:text-primary transition-colors p-3 rounded-lg hover:bg-brown-50"
                      >
                        All Products
                      </Link>
                      {categories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-base font-medium text-brown-700 hover:text-primary transition-colors p-3 rounded-lg hover:bg-brown-50"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </nav>

                    {!loading && user && (
                      <div className="flex flex-col gap-2 mt-4">
                        <Button
                          variant="outline"
                          className="border-brown-200 text-brown-700 hover:bg-brown-50 hover:text-primary"
                          onClick={() => {
                            router.push('/game');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Play Game
                        </Button>
                        <Button
                          variant="outline"
                          className="border-brown-200 text-brown-700 hover:bg-brown-50 hover:text-primary"
                          onClick={() => {
                            router.push(getDashboardLink());
                            setMobileMenuOpen(false);
                          }}
                        >
                          Dashboard
                        </Button>
                        <Button
                          variant="outline"
                          className="border-brown-200 text-brown-700 hover:bg-brown-50 hover:text-primary"
                          onClick={() => {
                            router.push('/dashboard/settings');
                            setMobileMenuOpen(false);
                          }}
                        >
                          Settings
                        </Button>
                        {isSuperUser && (
                          <Button
                            variant="outline"
                            className="border-brown-200 text-brown-700 hover:bg-brown-50 hover:text-primary"
                            onClick={() => {
                              router.push('/kasir');
                              setMobileMenuOpen(false);
                            }}
                          >
                            POS System
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={handleSignOut}
                        >
                          Sign out
                        </Button>
                      </div>
                    )}
                    {!loading && !user && (
                      <div className="flex flex-col gap-2 mt-4">
                        <Button
                          variant="outline"
                          className="border-brown-200 text-brown-700 hover:bg-brown-50 hover:text-primary"
                          onClick={() => router.push('/login')}
                        >
                          Sign in
                        </Button>
                        <Button
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => router.push('/register')}
                        >
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
