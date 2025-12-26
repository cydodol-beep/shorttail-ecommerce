'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PawPrint, ShoppingCart, Package, Clock, LogOut, Loader2, Bell, PanelRightClose, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidWebPDataUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';

const navItems = [
  { icon: ShoppingCart, label: 'POS', href: '/kasir' },
  { icon: Package, label: 'Orders', href: '/kasir/orders' },
  { icon: Clock, label: 'History', href: '/kasir/history' },
];

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { settings } = useStoreSettings();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      const { error } = await signOut();
      if (error) {
        console.error('Sign out error:', error);
        toast.error('Failed to sign out');
        setIsSigningOut(false);
      } else {
        toast.success('Signed out successfully');
        // Wait a moment for state to clear
        setTimeout(() => {
          router.push('/login');
          router.refresh();
        }, 100);
      }
    } catch (err) {
      console.error('Sign out failed:', err);
      toast.error('Failed to sign out');
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-brown-50 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white border-b border-brown-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/kasir" className="flex items-center gap-2">
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
            <span className="font-bold text-lg text-brown-900\">
              {settings?.storeName || 'Kasir POS'}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* Toggle Current Order Panel */}
          {pathname === '/kasir' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                const event = new CustomEvent('toggleCurrentOrder');
                window.dispatchEvent(event);
              }}
              title="Toggle Current Order"
            >
              <PanelRightClose className="h-5 w-5" />
            </Button>
          )}

          {/* Notification Bell */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                      onClick={() => markAllAsRead()}
                    >
                      Mark all as read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[400px]">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((notification) => (
                      <DropdownMenuItem 
                        key={notification.id}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 cursor-pointer",
                          !notification.is_read && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead(notification.id);
                          }
                          if (notification.action_link) {
                            router.push(notification.action_link);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </DropdownMenuItem>
                    ))
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {/* Profile Dropdown with Navigation */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 h-auto px-3 py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile?.user_avatar_url && isValidWebPDataUrl(profile.user_avatar_url) ? profile.user_avatar_url : undefined}
                      onError={(e) => {
                        console.error('Kasir avatar image failed to load:', profile?.user_avatar_url);
                      }}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {profile?.user_name?.charAt(0).toUpperCase() || 'K'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm text-left">
                    <p className="font-medium text-brown-900">{profile?.user_name || 'Kasir'}</p>
                    <p className="text-brown-500 text-xs">Cashier</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Menu</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {navItems.map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "cursor-pointer",
                      pathname === item.href && "bg-primary/10 text-primary"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  {isSigningOut ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4 mr-2" />
                  )}
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" className="flex items-center gap-3 h-auto px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-white">K</AvatarFallback>
              </Avatar>
              <div className="text-sm text-left">
                <p className="font-medium text-brown-900">Kasir</p>
                <p className="text-brown-500 text-xs">Cashier</p>
              </div>
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
