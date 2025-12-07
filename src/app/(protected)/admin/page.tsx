'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Tag,
  Star,
  Bell,
  FolderOpen,
  Truck,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  totalCategories: number;
  totalPromotions: number;
  totalReviews: number;
  totalNotifications: number;
  activePromotions: number;
  pendingReviews: number;
  unreadNotifications: number;
  pendingOrders: number;
  lowStockProducts: number;
  recentOrders: Array<{
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    user_name?: string;
  }>;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalCategories: 0,
    totalPromotions: 0,
    totalReviews: 0,
    totalNotifications: 0,
    activePromotions: 0,
    pendingReviews: 0,
    unreadNotifications: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    const supabase = createClient();

    try {
      const [
        productsRes,
        ordersRes,
        usersRes,
        revenueRes,
        categoriesRes,
        promotionsRes,
        activePromotionsRes,
        reviewsRes,
        pendingReviewsRes,
        notificationsRes,
        unreadNotificationsRes,
        pendingRes,
        lowStockRes,
        recentRes
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'normal_user'),
        supabase.from('orders').select('total_amount').eq('status', 'delivered'),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('promotions').select('id', { count: 'exact', head: true }),
        supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('notifications').select('id', { count: 'exact', head: true }),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('id', { count: 'exact', head: true }).lt('stock_quantity', 10),
        supabase.from('orders').select('id, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5),
      ]);

      const totalRevenue = revenueRes.data?.reduce((sum: number, order: { total_amount: number }) => sum + order.total_amount, 0) || 0;

      setStats({
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalUsers: usersRes.count || 0,
        totalRevenue,
        totalCategories: categoriesRes.count || 0,
        totalPromotions: promotionsRes.count || 0,
        totalReviews: reviewsRes.count || 0,
        totalNotifications: notificationsRes.count || 0,
        activePromotions: activePromotionsRes.count || 0,
        pendingReviews: pendingReviewsRes.count || 0,
        unreadNotifications: unreadNotificationsRes.count || 0,
        pendingOrders: pendingRes.count || 0,
        lowStockProducts: lowStockRes.count || 0,
        recentOrders: recentRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      description: 'From delivered orders',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      href: '/admin/orders?status=delivered',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toString(),
      icon: ShoppingCart,
      description: `${stats.pendingOrders} pending`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      href: '/admin/orders',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts.toString(),
      icon: Package,
      description: `${stats.lowStockProducts} low stock`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      href: '/admin/products',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      description: 'Normal users',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      href: '/admin/users',
    },
    {
      title: 'Categories',
      value: stats.totalCategories.toString(),
      icon: FolderOpen,
      description: 'Product categories',
      color: 'text-pink-600',
      bgColor: 'bg-pink-500/10',
      href: '/admin/categories',
    },
    {
      title: 'Promotions',
      value: stats.totalPromotions.toString(),
      icon: Tag,
      description: `${stats.activePromotions} active`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500/10',
      href: '/admin/promotions',
    },
    {
      title: 'Reviews',
      value: stats.totalReviews.toString(),
      icon: Star,
      description: `${stats.pendingReviews} pending`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-500/10',
      href: '/admin/reviews',
    },
    {
      title: 'Notifications',
      value: stats.totalNotifications.toString(),
      icon: Bell,
      description: `${stats.unreadNotifications} unread`,
      color: 'text-red-600',
      bgColor: 'bg-red-500/10',
      href: '/admin/notifications',
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brown-900">Admin Dashboard</h1>
          <p className="text-brown-600">Overview of your store performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="border-brown-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-4 bg-brown-100 rounded animate-pulse w-24" />
                  <div className="h-8 bg-brown-100 rounded animate-pulse w-16" />
                  <div className="h-3 bg-brown-100 rounded animate-pulse w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-900">Admin Dashboard</h1>
        <p className="text-brown-600">Overview of your store performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="border-brown-200 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-brown-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-brown-900 mt-1">{stat.value}</p>
                    <p className="text-xs text-brown-500 mt-1">{stat.description}</p>
                  </div>
                  <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="border-brown-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest customer orders</CardDescription>
            </div>
            <Link href="/admin/orders">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <p className="text-center text-brown-600 py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <Link key={order.id} href={`/admin/orders`}>
                    <div className="flex items-center justify-between p-4 bg-brown-50 rounded-lg hover:bg-brown-100 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium text-brown-900">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-brown-600">
                          {new Date(order.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">
                          {formatPrice(order.total_amount)}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={
                            order.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                            order.status === 'paid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            order.status === 'packed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            order.status === 'shipped' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            order.status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className="border-brown-200">
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/admin/orders?status=pending">
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-brown-900">Pending Orders</p>
                      <p className="text-sm text-brown-600">Orders awaiting payment</p>
                    </div>
                  </div>
                  <Badge className="bg-yellow-500">{stats.pendingOrders}</Badge>
                </div>
              </Link>

              <Link href="/admin/products">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-brown-900">Low Stock Items</p>
                      <p className="text-sm text-brown-600">Products needing restock</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-500">{stats.lowStockProducts}</Badge>
                </div>
              </Link>

              <Link href="/admin/reviews">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-brown-900">Pending Reviews</p>
                      <p className="text-sm text-brown-600">Reviews awaiting moderation</p>
                    </div>
                  </div>
                  <Badge className="bg-purple-500">{stats.pendingReviews}</Badge>
                </div>
              </Link>

              <Link href="/admin/notifications">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-brown-900">Unread Notifications</p>
                      <p className="text-sm text-brown-600">New system notifications</p>
                    </div>
                  </div>
                  <Badge className="bg-red-500">{stats.unreadNotifications}</Badge>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-brown-200 mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/products/new">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Package className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Add Product</p>
                  <p className="text-xs text-muted-foreground">Create new product</p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/categories">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <FolderOpen className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Manage Categories</p>
                  <p className="text-xs text-muted-foreground">Add or edit categories</p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/promotions">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Tag className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Create Promotion</p>
                  <p className="text-xs text-muted-foreground">Add discount codes</p>
                </div>
              </Button>
            </Link>
            <Link href="/admin/shipping">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Truck className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Shipping Rates</p>
                  <p className="text-xs text-muted-foreground">Manage courier rates</p>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
