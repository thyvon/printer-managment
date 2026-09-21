"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtPeriod } from "@/lib/dates";

type AnalyticsData = {
  monthly_trend: Array<{
    month: string;
    tenants: number;
    revenue: number;
  }>;
  by_plan: {
    starter: number;
    growth: number;
    enterprise: number;
  };
  by_status: {
    active: number;
    trial: number;
    suspended: number;
  };
};

export default function AnalyticsPage() {
  const t = useTranslations("Platform");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-analytics"],
    queryFn: () => api.get<AnalyticsData>("/platform/analytics"),
  });

  if (isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {t("loadError")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("analyticsTitle")} description={t("analyticsSubtitle")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("tenantGrowth")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => fmtPeriod(v)} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                  <Tooltip />
                  <Bar dataKey="tenants" name={t("tenants")} fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("revenueTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => fmtPeriod(v)} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={60} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="revenue" name={t("revenue")} fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("byPlan")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Starter</span>
              <span className="font-medium">{data.by_plan.starter}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Growth</span>
              <span className="font-medium">{data.by_plan.growth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Enterprise</span>
              <span className="font-medium">{data.by_plan.enterprise}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("byStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("active")}</span>
              <span className="font-medium">{data.by_status.active}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("trial")}</span>
              <span className="font-medium">{data.by_status.trial}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("suspended")}</span>
              <span className="font-medium">{data.by_status.suspended}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
