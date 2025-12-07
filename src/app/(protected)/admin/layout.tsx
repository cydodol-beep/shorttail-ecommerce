'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, LogOut, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotificationStore } from '@/store/notification-store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const { profile, signOut, loading } = useAuth();
  const unreadCount = useNotificationStore((state) => state.unreadCount);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Force redirect regardless of error
      window.location.href = '/login';
    } catch (err) {
      console.error('Sign out failed:', err);
      // Still redirect on error
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex h-screen bg-brown-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin Header */}
        <header className="h-16 bg-white border-b border-brown-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-brown-900">Admin Panel</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Store Link */}
            <Button variant="outline" size="sm" asChild>
              <Link href="/" target="_blank">
                <Store className="h-4 w-4 mr-2" />
                View Store
              </Link>
            </Button>

            {mounted && (
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
                    <Button variant="ghost" className="flex items-center gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.user_avatar_url || undefined} />
                        <AvatarFallback className="bg-primary text-white">
                          {profile?.user_name?.charAt(0).toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        {loading ? (
                          <>
                            <div className="h-4 w-20 bg-brown-100 rounded animate-pulse" />
                            <div className="h-3 w-16 bg-brown-100 rounded animate-pulse mt-1" />
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-medium">{profile?.user_name || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {profile?.role?.replace('_', ' ') || 'Admin'}
                            </p>
                          </>
                        )}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
