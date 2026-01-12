'use client';

import { useState, useEffect } from 'react';
import { Bar, Line, Pie, Chart as ChartJS } from 'chart.js/auto';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Globe, Monitor, Smartphone, Users } from 'lucide-react';
import { useTheme } from 'next-themes';

ChartJS.register(Bar, Line, Pie);

interface TrafficDataPoint {
  date?: string;
  hour?: string;
  day?: string;
  month?: string;
  year?: number;
  unique_visitors: number;
  total_visits: number;
}

interface TrafficSummary {
  total_visitors: number;
  today_visitors: number;
  week_visitors: number;
  month_visitors: number;
  avg_daily_visitors: number;
}

interface TopPage {
  page_url: string;
  visit_count: number;
  unique_visitors: number;
}

interface CountryTraffic {
  country_code: string;
  visitor_count: number;
}

interface DeviceTraffic {
  device_type: string;
  visitor_count: number;
}

export default function TrafficAnalytics() {
  const { theme } = useTheme();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [period, setPeriod] = useState<'hourly' | 'daily' | 'monthly' | 'yearly'>('daily');
  const [trafficData, setTrafficData] = useState<TrafficDataPoint[]>([]);
  const [summary, setSummary] = useState<TrafficSummary | null>(null);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [countries, setCountries] = useState<CountryTraffic[]>([]);
  const [devices, setDevices] = useState<DeviceTraffic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      // Fetch traffic data based on selected period
      const trafficResponse = await fetch(`/api/analytics/traffic?period=${period}&days=${getDaysForPeriod(period)}`);
      const trafficResult = await trafficResponse.json();
      
      if (trafficResult.success) {
        setTrafficData(trafficResult.data);
      }

      // Fetch summary
      const summaryResponse = await fetch('/api/analytics/metrics?type=summary');
      const summaryResult = await summaryResponse.json();
      
      if (summaryResult.success) {
        setSummary(summaryResult.data[0]);
      }

      // Fetch top pages
      const topPagesResponse = await fetch('/api/analytics/metrics?type=topPages');
      const topPagesResult = await topPagesResponse.json();
      
      if (topPagesResult.success) {
        setTopPages(topPagesResult.data);
      }

      // Fetch countries
      const countriesResponse = await fetch('/api/analytics/metrics?type=byCountry');
      const countriesResult = await countriesResponse.json();
      
      if (countriesResult.success) {
        setCountries(countriesResult.data);
      }

      // Fetch devices
      const devicesResponse = await fetch('/api/analytics/metrics?type=byDevice');
      const devicesResult = await devicesResponse.json();
      
      if (devicesResult.success) {
        setDevices(devicesResult.data);
      }
    } catch (error) {
      console.error('Error fetching traffic data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysForPeriod = (period: string): number => {
    switch (period) {
      case 'hourly': return 1;
      case 'daily': return 30;
      case 'monthly': return 365;
      case 'yearly': return 365 * 2;
      default: return 30;
    }
  };

  useEffect(() => {
    fetchTrafficData();
  }, [period]);

  // Prepare data for charts
  const chartData = {
    labels: trafficData.map(item => {
      if (item.hour) return item.hour;
      if (item.day) return item.day;
      if (item.month) return item.month;
      if (item.year) return item.year.toString();
      return '';
    }),
    datasets: [
      {
        label: 'Unique Visitors',
        data: trafficData.map(item => item.unique_visitors),
        backgroundColor: theme === 'dark' ? 'rgba(72, 187, 120, 0.6)' : 'rgba(34, 197, 94, 0.6)',
        borderColor: theme === 'dark' ? 'rgba(72, 187, 120, 1)' : 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Visits',
        data: trafficData.map(item => item.total_visits),
        backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.6)' : 'rgba(59, 130, 246, 0.6)',
        borderColor: theme === 'dark' ? 'rgba(99, 102, 241, 1)' : 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pieChartData = {
    labels: countries.map(country => country.country_code),
    datasets: [
      {
        data: countries.map(country => country.visitor_count),
        backgroundColor: [
          '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
          '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
          '#84cc16', '#6366f1'
        ],
      },
    ],
  };

  const deviceChartData = {
    labels: devices.map(device => device.device_type),
    datasets: [
      {
        data: devices.map(device => device.visitor_count),
        backgroundColor: [
          '#10b981', '#f59e0b', '#3b82f6'
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Traffic Analytics</h2>
          <p className="text-muted-foreground">
            Monitor your website's visitor traffic, demographics, and performance
          </p>
        </div>
        
        <div className="flex gap-4">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Last 24 Hours</SelectItem>
              <SelectItem value="daily">Last 30 Days</SelectItem>
              <SelectItem value="monthly">Last 12 Months</SelectItem>
              <SelectItem value="yearly">Last 2 Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_visitors?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Since tracking began</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.today_visitors?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Visitors in the last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Monthly Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.month_visitors?.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Past 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Avg Daily Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avg_daily_visitors?.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">Average per day (last 30 days)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Traffic Over Time</CardTitle>
              <CardDescription>
                Unique visitors and total visits over the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line 
                  data={chartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Visitor Trends'
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Traffic by Country</CardTitle>
              <CardDescription>Top countries by visitor count</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Pie 
                  data={pieChartData} 
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'right' as const,
                      }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Traffic by Device</CardTitle>
            <CardDescription>How visitors access your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie 
                data={deviceChartData} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    }
                  }
                }} 
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              {devices.map((device, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold">
                    {device.visitor_count}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {device.device_type}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most visited pages on your site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <div className="font-medium truncate max-w-[200px]">{page.page_url}</div>
                    <div className="text-sm text-muted-foreground">
                      {page.visit_count} visits • {page.unique_visitors} unique
                    </div>
                  </div>
                  <div className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-sm">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}