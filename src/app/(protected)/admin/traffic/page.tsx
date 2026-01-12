
import TrafficClient from "@/components/admin/traffic/TrafficClient";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Traffic Analytics",
  description: "View website traffic analytics.",
};

export default async function TrafficPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["master_admin", "normal_admin"].includes(profile.role)) {
    return redirect("/unauthorized");
  }

  // Fetch all traffic data in parallel
  const [
    summaryRes,
    dailyTrafficRes,
    topPagesRes,
    byCountryRes,
    byDeviceRes,
  ] = await Promise.all([
    supabase.rpc("get_traffic_summary"),
    supabase.rpc("get_daily_traffic", {
      start_date: new Date(
        new Date().setDate(new Date().getDate() - 30)
      ).toISOString(),
      end_date: new Date().toISOString(),
    }),
    supabase.rpc("get_top_pages", { period_days: 30 }),
    supabase.rpc("get_traffic_by_country", { period_days: 30 }),
    supabase.rpc("get_traffic_by_device", { period_days: 30 }),
  ]);

  const summary = summaryRes.data?.[0];
  const dailyTraffic = dailyTrafficRes.data;
  const topPages = topPagesRes.data;
  const byCountry = byCountryRes.data;
  const byDevice = byDeviceRes.data;

  return (
    <TrafficClient
      summary={summary}
      dailyTraffic={dailyTraffic}
      topPages={topPages}
      byCountry={byCountry}
      byDevice={byDevice}
    />
  );
}
