'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Globe, Monitor, Smartphone, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useTrafficAnalyticsStore } from '@/store/traffic-analytics-store';

// Simple SVG bar chart component
const SimpleBarChart = ({ data, labels, title }: { data: number[]; labels: string[]; title: string }) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
  const maxValue = Math.max(...data, 1); // Avoid division by zero
  const barWidth = 30;
  const barSpacing = 15;
  const chartHeight = 200;
  const chartWidth = Math.min(600, labels.length * (barWidth + barSpacing));
  
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-max">
        <h3 className="text-center mb-2">{title}</h3>
        <div className="flex items-end justify-between h-48" style={{ width: chartWidth }}>
          {data.map((value, index) => (
            <div key={index} className="flex flex-col items-center mx-1">
              <div className="text-xs text-center mb-1 truncate max-w-[60px]">{labels[index]}</div>
              <div
                className="w-6 bg-primary rounded-t-md"
                style={{
                  height: `${(value / maxValue) * 80}%`,
                  minHeight: value > 0 ? '2px' : '0px'
                }}
              />
              <div className="text-xs mt-1">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Simple SVG pie chart component
const SimplePieChart = ({ data, labels }: { data: number[]; labels: string[] }) => {
  if (!data || data.length === 0) return <div>No data available</div>;
  
  const total = data.reduce((sum, value) => sum + value, 0);
  if (total === 0) return <div>No data available</div>;
  
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const centerX = 100;
  const centerY = 100;
  
  let startAngle = 0;
  
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
    '#84cc16', '#6366f1'
  ];
  
  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {data.map((value, index) => {
          const slicePercentage = value / total;
          const sliceAngle = slicePercentage * 360;
          const endAngle = startAngle + sliceAngle;
          
          // Convert angles to radians
          const startAngleRad = (startAngle - 90) * (Math.PI / 180);
          const endAngleRad = (endAngle - 90) * (Math.PI / 180);
          
          // Calculate start and end points
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          // Large arc flag (1 if angle > 180, 0 otherwise)
          const largeArcFlag = sliceAngle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');
          
          startAngle = endAngle;
          
          return (
            <path
              key={index}
              d={pathData}
              fill={colors[index % colors.length]}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        <circle cx={centerX} cy={centerY} r={radius * 0.5} fill="white" />
      </svg>
      <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-xs">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: colors[index % colors.length] }}
            ></div>
            <span className="text-xs truncate">{label}</span>
            <span className="text-xs ml-1 text-muted-foreground">({data[index]})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function TrafficAnalytics() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState<'hourly' | 'daily' | 'monthly' | 'yearly'>('daily');
  
  const {
    trafficData,
    summary,
    topPages,
    countries,
    devices,
    loading,
    fetchTrafficData,
    fetchSummary,
    fetchTopPages,
    fetchCountries,
    fetchDevices
  } = useTrafficAnalyticsStore();

  useEffect(() => {
    // Fetch all data when component mounts or period changes
    fetchTrafficData(period, getDaysForPeriod(period));
    fetchSummary();
    fetchTopPages();
    fetchCountries();
    fetchDevices();
  }, [period]);

  const getDaysForPeriod = (period: string): number => {
    switch (period) {
      case 'hourly': return 1;
      case 'daily': return 30;
      case 'monthly': return 365;
      case 'yearly': return 365 * 2;
      default: return 30;
    }
  };

  // Prepare data for charts
  const chartLabels = trafficData.map(item => {
    if (item.hour) return item.hour;
    if (item.day) return item.day;
    if (item.month) return item.month;
    if (item.year) return item.year.toString();
    return '';
  });
  
  const uniqueVisitorsData = trafficData.map(item => item.unique_visitors);
  const totalVisitsData = trafficData.map(item => item.total_visits);

  // Prepare data for pie charts
  const countryLabels = countries.map(country => country.country_code);
  const countryData = countries.map(country => country.visitor_count);
  
  const deviceLabels = devices.map(device => device.device_type);
  const deviceData = devices.map(device => device.visitor_count);

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
              <div className="h-80 overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-center mb-2">Unique Visitors</h4>
                      <SimpleBarChart 
                        data={uniqueVisitorsData} 
                        labels={chartLabels} 
                        title="Unique Visitors" 
                      />
                    </div>
                    <div>
                      <h4 className="text-center mb-2">Total Visits</h4>
                      <SimpleBarChart 
                        data={totalVisitsData} 
                        labels={chartLabels} 
                        title="Total Visits" 
                      />
                    </div>
                  </div>
                </div>
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
              <div className="h-80 flex items-center justify-center">
                <SimplePieChart 
                  data={countryData} 
                  labels={countryLabels} 
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
            <div className="h-64 flex items-center justify-center">
              <SimplePieChart 
                data={deviceData} 
                labels={deviceLabels} 
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