
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Eye, Users, ArrowUpRight, Globe, Smartphone, Tablet, Monitor } from "lucide-react";

type TrafficClientProps = {
  summary: any;
  dailyTraffic: any[];
  topPages: any[];
  byCountry: any[];
  byDevice: any[];
};

export default function TrafficClient({
  summary,
  dailyTraffic,
  topPages,
  byCountry,
  byDevice,
}: TrafficClientProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Traffic Analytics</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.total_visitors ?? 0}</div>
            <p className="text-xs text-muted-foreground">All time unique visitors</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.today_visitors ?? 0}</div>
            <p className="text-xs text-muted-foreground">Unique visitors today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Visitors</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.avg_daily_visitors?.toFixed(1) ?? 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.month_visitors ?? 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days unique visitors</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Daily Unique Visitors (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={dailyTraffic}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="unique_visitors" fill="#8884d8" name="Unique Visitors" />
                <Bar dataKey="total_visits" fill="#82ca9d" name="Total Visits" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top 10 Pages</CardTitle>
            <CardDescription>Most visited pages in the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page URL</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages?.map((page) => (
                  <TableRow key={page.page_url}>
                    <TableCell className="truncate max-w-[150px]">{page.page_url}</TableCell>
                    <TableCell className="text-right">{page.visit_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Location and Device */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Traffic by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead className="text-right">Visitors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byCountry?.map((c) => (
                  <TableRow key={c.country_code}>
                    <TableCell>{c.country_code}</TableCell>
                    <TableCell className="text-right">{c.visitor_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Traffic by Device</CardTitle>
          </CardHeader>
          <CardContent>
            {byDevice?.map((d) => (
              <div key={d.device_type} className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  {d.device_type === 'Mobile' && <Smartphone className="h-4 w-4 mr-2" />}
                  {d.device_type === 'Tablet' && <Tablet className="h-4 w-4 mr-2" />}
                  {d.device_type === 'Desktop' && <Monitor className="h-4 w-4 mr-2" />}
                  <span>{d.device_type}</span>
                </div>
                <span>{d.visitor_count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
