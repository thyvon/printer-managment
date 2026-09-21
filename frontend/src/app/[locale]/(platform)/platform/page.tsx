"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PlatformSummary } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import {
  Building2,
  CreditCard,
  Gauge,
  Users,
} from "lucide-react";

function formatMoney(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PlatformDashboardPage() {
  const t = useTranslations("Platform");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-dashboard"],
    queryFn: () => api.get<PlatformSummary>("/platform/dashboard"),
  });

  if (isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {t("loadError")}
      </p>
    );
  }

  const statCards = [
    { key: "totalTenants", value: data.summary.total_tenants, icon: Building2 },
    { key: "activeTenants", value: data.summary.active_tenants, icon: Users },
    { key: "trialTenants", value: data.summary.trial_tenants, icon: Users },
    { key: "totalPrinters", value: data.summary.total_printers, icon: Gauge },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("dashboardTitle")} description={t("dashboardSubtitle")} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(`stats.${card.key}`)}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-semibold">{card.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-4" />
              {t("mrr")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-semibold">{formatMoney(data.mrr.total)}</p>
            <p className="text-sm text-muted-foreground">
              {t("mrrCount", { count: data.mrr.count })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("plans")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Starter</span>
              <span className="font-medium">{data.plans.starter}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Growth</span>
              <span className="font-medium">{data.plans.growth}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Enterprise</span>
              <span className="font-medium">{data.plans.enterprise}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("overview")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("totalUsers")}</span>
              <span className="font-medium">{data.summary.total_users}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("totalCustomers")}</span>
              <span className="font-medium">{data.summary.total_customers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("totalSites")}</span>
              <span className="font-medium">{data.summary.total_sites}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("recentTenants")}</CardTitle>
          <Link href="/platform/tenants" className="text-sm text-muted-foreground hover:text-foreground">
            {t("viewAll")}
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenantName")}</TableHead>
                <TableHead>{t("plan")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recent_tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    <Link href={`/platform/tenants/${tenant.id}`} className="hover:underline">
                      {tenant.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tenant.plan} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={tenant.status} />
                  </TableCell>
                  <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
