'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Heart,
  PawPrint,
  Gift,
  Settings,
  ChevronRight,
  Trophy,
  TrendingUp,
  Bell,
  Home,
  Package,
  User,
  LogOut,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  LayoutGrid,
  Sparkles,
  Zap,
  Activity,
  ChevronDown,
  MoreHorizontal,
  Copy,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useStoreSettingsStore } from '@/store/store-settings-store';
import { createClient } from '@/lib/supabase/client';
import { isValidWebPDataUrl, getAvatarDataInfo, cn } from '@/lib/utils';
import type { Order, Pet } from '@/types/database';

// 8-point grid spacing scale
const spacing = {
  1: '2px',
  2: '4px', 
  3: '8px',
  4: '12px',
  5: '16px',
  6: '24px',
  7: '32px',
  8: '48px',
};

const tierThresholds = {
  Newborn: 0,
  Transitional: 500,
  Juvenile: 2000,
  Adolescence: 5000,
  Adulthood: 10000,
};

const tierColors = {
  Newborn: 'bg-slate-500',
  Transitional: 'bg-emerald-500',
  Juvenile: 'bg-blue-500',
  Adolescence: 'bg-violet-500',
  Adulthood: 'bg-amber-500',
};

const tierGradients = {
  Newborn: 'from-slate-500 to-slate-600',
  Transitional: 'from-emerald-500 to-emerald-600',
  Juvenile: 'from-blue-500 to-blue-600',
  Adolescence: 'from-violet-500 to-violet-600',
  Adulthood: 'from-amber-500 to-amber-600',
};

// Mock data for sparklines
const sparklineData = [
  { value: 30 }, { value: 45 }, { value: 35 }, { value: 50 }, { value: 48 },
  { value: 60 }, { value: 55 }, { value: 70 }, { value: 65 }, { value: 80 },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

// Navigation items
const navItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingBag, label: 'Orders', href: '/dashboard/orders' },
  { icon: PawPrint, label: 'My Pets', href: '/dashboard/pets' },
  { icon: Heart, label: 'Wishlist', href: '/dashboard/wishlist' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
  { icon: Trophy, label: 'Achievements', href: '/dashboard/achievements' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

// Loading skeleton for widgets
function WidgetSkeleton() {
  return (
    <Card className="border-slate-200/60 dark:border-slate-700/60">
      <CardHeader className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
}

// Error Boundary Component
class DashboardErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 text-center border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">Something went wrong loading this widget.</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, user, refetchProfile, signOut } = useAuth();
  const { allSettings } = useStoreSettingsStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Hidden by default on mobile
  const [isDesktop, setIsDesktop] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState(3);

  // Detect desktop screen size
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Toggle dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    const [ordersRes, petsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id),
    ]);

    setOrders(ordersRes.data || []);
    setPets(petsRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const getNextTier = () => {
    const tiers = Object.keys(tierThresholds) as Array<keyof typeof tierThresholds>;
    const currentIndex = tiers.indexOf(profile?.tier || 'Newborn');
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    return null;
  };

  const getProgressToNextTier = () => {
    const currentPoints = profile?.points_balance || 0;
    const currentTierPoints = tierThresholds[profile?.tier || 'Newborn'];
    const nextTier = getNextTier();
    if (!nextTier) return 100;
    const nextTierPoints = tierThresholds[nextTier];
    const progress = ((currentPoints - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  const copyReferralCode = () => {
    const code = referralCode || profile?.referral_code;
    if (code) {
      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${code}`);
    }
  };

  return (
    <div className={cn("min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300", darkMode && "dark")}>
      <div className="flex relative">
        {/* Mobile Overlay Backdrop */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Collapsible Sidebar - Hidden by default on mobile, always visible on desktop */}
        <motion.aside
          initial={false}
          animate={{
            x: isDesktop || sidebarOpen ? 0 : -240,
            opacity: isDesktop || sidebarOpen ? 1 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={cn(
            "fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-700/60 z-50 overflow-hidden w-[240px]"
          )}
        >
          {/* Sidebar Header with Close Button for Mobile */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200/60 dark:border-slate-700/60 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Menu
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="p-3 space-y-1 pt-4 lg:pt-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)} // Close sidebar on mobile when item clicked
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Tier Progress in Sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200/60 dark:border-slate-700/60">
            <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {profile?.tier || 'Newborn'}
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                  style={{ width: `${getProgressToNextTier()}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {tierThresholds[getNextTier() || 'Adulthood'] - (profile?.points_balance || 0)} pts to next tier
              </p>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 min-h-screen w-full">
          {/* Mobile Header with Menu Toggle */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Welcome back, {profile?.user_name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Here's what's happening today.
              </p>
            </div>
          </div>

          {/* Desktop Welcome Section */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Welcome back, {profile?.user_name?.split(' ')[0] || 'User'}! 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Here's what's happening with your account today.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* KPI Cards */}
            <DashboardErrorBoundary>
              <Suspense fallback={<WidgetSkeleton />}>
                <KPICard
                  title="Total Orders"
                  value={orders.length.toString()}
                  trend="+12%"
                  trendUp={true}
                  icon={Package}
                  color="indigo"
                  data={sparklineData}
                />
              </Suspense>
            </DashboardErrorBoundary>

            <DashboardErrorBoundary>
              <Suspense fallback={<WidgetSkeleton />}>
                <KPICard
                  title="Points Balance"
                  value={(profile?.points_balance || 0).toLocaleString()}
                  trend="+250"
                  trendUp={true}
                  icon={Zap}
                  color="amber"
                  data={sparklineData.map(d => ({ value: d.value * 1.2 }))}
                />
              </Suspense>
            </DashboardErrorBoundary>

            <DashboardErrorBoundary>
              <Suspense fallback={<WidgetSkeleton />}>
                <KPICard
                  title="Wishlist Items"
                  value="12"
                  trend="+3"
                  trendUp={true}
                  icon={Heart}
                  color="rose"
                  data={sparklineData.map(d => ({ value: d.value * 0.8 }))}
                />
              </Suspense>
            </DashboardErrorBoundary>

            <DashboardErrorBoundary>
              <Suspense fallback={<WidgetSkeleton />}>
                <KPICard
                  title="Active Pets"
                  value={pets.length.toString()}
                  trend="0"
                  trendUp={true}
                  icon={PawPrint}
                  color="emerald"
                  data={sparklineData.map(d => ({ value: d.value * 0.5 }))}
                />
              </Suspense>
            </DashboardErrorBoundary>

            {/* Membership Card - Spans 2 columns */}
            <Card className="md:col-span-2 border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-indigo-500" />
                  Membership Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                    tierGradients[profile?.tier || 'Newborn']
                  )}>
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {profile?.tier || 'Newborn'} Member
                      </h3>
                      <span className="text-sm text-slate-500">
                        {profile?.points_balance || 0} / {tierThresholds[getNextTier() || 'Adulthood']} pts
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressToNextTier()}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                          "h-full rounded-full bg-gradient-to-r",
                          tierGradients[profile?.tier || 'Newborn']
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Tier Roadmap */}
                <div className="flex justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {Object.entries(tierThresholds).map(([tier, points], index) => {
                    const isAchieved = (profile?.points_balance || 0) >= points;
                    const isCurrent = profile?.tier === tier;
                    return (
                      <div key={tier} className="flex flex-col items-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                          isCurrent 
                            ? "bg-indigo-500 text-white ring-2 ring-indigo-200 dark:ring-indigo-800"
                            : isAchieved
                            ? "bg-emerald-500 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          {index + 1}
                        </div>
                        <span className={cn(
                          "text-[10px] mt-1 font-medium",
                          isCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"
                        )}>
                          {tier}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Referral Card */}
            <Card className="border-slate-200/60 dark:border-slate-700/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-rose-500" />
                  Refer & Earn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  Share with friends and earn points!
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono text-slate-900 dark:text-slate-100">
                    {profile?.referral_code || 'Loading...'}
                  </code>
                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={copyReferralCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-slate-200/60 dark:border-slate-700/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <QuickActionButton icon={ShoppingBag} label="Shop Now" href="/shop" color="indigo" />
                <QuickActionButton icon={Package} label="View Orders" href="/dashboard/orders" color="emerald" />
                <QuickActionButton icon={PawPrint} label="Add Pet" href="/dashboard/pets/new" color="amber" />
                <QuickActionButton icon={Heart} label="Wishlist" href="/dashboard/wishlist" color="rose" />
              </CardContent>
            </Card>

            {/* Recent Orders - Spans 2 columns */}
            <Card className="md:col-span-2 lg:col-span-2 border-slate-200/60 dark:border-slate-700/60">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Orders</CardTitle>
                <Link href="/dashboard/orders">
                  <Button variant="ghost" size="sm" className="h-8">
                    View all
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No orders yet</p>
                    <Link href="/shop">
                      <Button variant="link" size="sm">Start shopping</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatPrice(order.total_amount)}
                          </p>
                          <Badge variant="secondary" className="text-[10px]">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* My Pets */}
            <Card className="border-slate-200/60 dark:border-slate-700/60">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">My Pets</CardTitle>
                <Link href="/dashboard/pets">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : pets.length === 0 ? (
                  <div className="text-center py-6 text-slate-500">
                    <PawPrint className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs mb-2">No pets added</p>
                    <Link href="/dashboard/pets/new">
                      <Button size="sm" variant="outline" className="h-7 text-xs">Add pet</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pets.slice(0, 3).map((pet) => (
                      <div
                        key={pet.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center overflow-hidden">
                          {pet.pet_image_url ? (
                            <img src={pet.pet_image_url} alt={pet.pet_name} className="w-full h-full object-cover" />
                          ) : (
                            <PawPrint className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                            {pet.pet_name}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">{pet.pet_type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Feed - Spans full width on mobile, 1 column on large */}
            <Card className="border-slate-200/60 dark:border-slate-700/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ActivityItem
                    icon={ShoppingBag}
                    iconColor="indigo"
                    title="Order placed"
                    description="Order #1234 confirmed"
                    time="2 hours ago"
                  />
                  <ActivityItem
                    icon={Zap}
                    iconColor="amber"
                    title="Points earned"
                    description="+50 points from purchase"
                    time="2 hours ago"
                  />
                  <ActivityItem
                    icon={Trophy}
                    iconColor="violet"
                    title="Tier upgraded"
                    description="You're now Juvenile!"
                    time="1 day ago"
                  />
                  <ActivityItem
                    icon={Heart}
                    iconColor="rose"
                    title="Item wishlisted"
                    description="Premium Dog Food added"
                    time="2 days ago"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Floating Quick Action Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-indigo-500 to-violet-600"
            >
              <LayoutGrid className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/shop" className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Shop Now
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/pets/new" className="flex items-center gap-2">
                <PawPrint className="h-4 w-4" />
                Add Pet
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/game" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Play Game
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    </div>
  );
}

// KPI Card Component with Sparkline
function KPICard({
  title,
  value,
  trend,
  trendUp,
  icon: Icon,
  color,
  data,
}: {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ElementType;
  color: string;
  data: { value: number }[];
}) {
  const colorMap: Record<string, { bg: string; text: string; stroke: string }> = {
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600 dark:text-indigo-400', stroke: '#6366f1' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', stroke: '#f59e0b' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', stroke: '#f43f5e' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400', stroke: '#10b981' },
  };

  const colors = colorMap[color] || colorMap.indigo;

  return (
    <Card className="border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", colors.bg)}>
            <Icon className={cn("h-4 w-4", colors.text)} />
          </div>
          <div className={cn(
            "text-xs font-medium",
            trendUp ? "text-emerald-600" : "text-rose-600"
          )}>
            {trend}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
          <p className="text-sm text-slate-500">{title}</p>
        </div>
        <div className="h-10 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={colors.stroke}
                strokeWidth={2}
                dot={false}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                itemStyle={{ color: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Button
function QuickActionButton({
  icon: Icon,
  label,
  href,
  color,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:text-indigo-600',
    emerald: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600',
    amber: 'hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600',
    rose: 'hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600',
  };

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 transition-all hover:translate-x-1",
        colorMap[color]
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

// Activity Item Component
function ActivityItem({
  icon: Icon,
  iconColor,
  title,
  description,
  time,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  description: string;
  time: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="flex items-start gap-3">
      <div className={cn("p-1.5 rounded-lg shrink-0", colorMap[iconColor])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-xs text-slate-500 truncate">{description}</p>
      </div>
      <span className="text-[10px] text-slate-400 shrink-0">{time}</span>
    </div>
  );
}
