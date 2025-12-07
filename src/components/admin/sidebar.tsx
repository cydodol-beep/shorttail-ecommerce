'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Tag, 
  Truck,
  Bell,
  Settings,
  Star,
  PawPrint,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  LogOut,
  Layout
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useStoreSettings } from '@/hooks/use-store-settings';
import Image from 'next/image';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: FolderOpen, label: 'Categories', href: '/admin/categories' },
  { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Tag, label: 'Promotions', href: '/admin/promotions' },
  { icon: Truck, label: 'Shipping', href: '/admin/shipping' },
  { icon: Star, label: 'Reviews', href: '/admin/reviews' },
  { icon: Layout, label: 'Landing Page', href: '/admin/landing-page' },
  { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { signOut, profile, loading } = useAuth();
  const { settings } = useStoreSettings();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // Call signOut from auth hook
      await signOut();
      
      // Small delay to ensure cookies are cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force hard redirect to clear any cached state
      window.location.replace('/login');
    } catch (err) {
      console.error('Sign out failed:', err);
      // Still force redirect on error
      window.location.replace('/login');
    }
  };

  return (
    <aside 
      className={cn(
        "h-screen bg-white border-r border-brown-200 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "h-16 flex items-center border-b border-brown-200 px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2">
            {settings?.storeLogo ? (
              <div className="relative w-8 h-8">
                {settings.storeLogo.startsWith('data:') ? (
                  <img
                    src={settings.storeLogo}
                    alt={settings.storeName || 'Store Logo'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={settings.storeLogo}
                    alt={settings.storeName || 'Store Logo'}
                    fill
                    className="object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="p-1.5 bg-primary rounded-lg">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
            )}
            <span className="font-bold text-base text-brown-900 truncate">
              {settings?.storeName || 'Admin'}
            </span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin">
            {settings?.storeLogo ? (
              <div className="relative w-8 h-8">
                {settings.storeLogo.startsWith('data:') ? (
                  <img
                    src={settings.storeLogo}
                    alt={settings.storeName || 'Store Logo'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image
                    src={settings.storeLogo}
                    alt={settings.storeName || 'Store Logo'}
                    fill
                    className="object-contain"
                  />
                )}
              </div>
            ) : (
              <div className="p-1.5 bg-primary rounded-lg">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
            )}
          </Link>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-white" 
                  : "text-brown-600 hover:bg-brown-50 hover:text-brown-900",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-brown-200 space-y-3">
        {/* User Info */}
        {!collapsed && (
          <div className="px-2 py-2">
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 w-24 bg-brown-100 rounded animate-pulse" />
                <div className="h-3 w-20 bg-brown-100 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-brown-900 truncate">
                  {profile?.user_name || 'Admin User'}
                </p>
                <p className="text-xs text-brown-500 capitalize">
                  {profile?.role?.replace('_', ' ') || 'Admin'}
                </p>
              </>
            )}
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full text-brown-600 hover:text-destructive hover:bg-destructive/10",
            collapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className={cn("h-4 w-4", signingOut && "animate-spin")} />
          {!collapsed && <span className="ml-2">{signingOut ? 'Signing out...' : 'Sign out'}</span>}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
