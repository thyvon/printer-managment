"use client";

import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardSummary } from "@/lib/types";
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
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  FileText,
  Gauge,
  MapPin,
  Printer,
  Users,
} from "lucide-react";

function formatMoney(amount: number, currency: string, locale: string) {
  const symbol = currency === "KHR" ? "៛" : "$";
  return `${symbol}${amount.toLocaleString(locale === "km" ? "en-US" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const locale = useLocale();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/dashboard"),
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
    { key: "customers", value: data.counts.customers, icon: Users },
    { key: "sites", value: data.counts.sites, icon: MapPin },
    { key: "printers", value: data.counts.printers, icon: Printer },
    { key: "activeContracts", value: data.counts.active_contracts, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("usageTrend.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.usage_trend.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("usageTrend.empty")}
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.usage_trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={40} />
                    <Tooltip
                      formatter={(value) => Number(value).toLocaleString()}
                    />
                    <Bar dataKey="mono_pages" name={t("usageTrend.mono")} stackId="a" fill="var(--chart-2)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="color_pages" name={t("usageTrend.color")} stackId="a" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("thisMonth")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Gauge className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {formatMoney(
                    data.invoices_this_month.total,
                    "USD",
                    locale
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("invoicesCount", { count: data.invoices_this_month.count })}
                </p>
              </div>
            </div>
            <Link
              href="/invoices"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("viewInvoices")}
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("recentInvoices")}</CardTitle>
            <Link href="/invoices" className="text-sm text-muted-foreground hover:text-foreground">
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.recent_invoices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("emptyInvoices")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("invoiceNumber")}</TableHead>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent_invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                          {invoice.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.customer?.name ?? "-"}</TableCell>
                      <TableCell>
                        {formatMoney(invoice.total, invoice.currency, locale)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={invoice.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("recentCustomers")}</CardTitle>
            <Link href="/customers" className="text-sm text-muted-foreground hover:text-foreground">
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.customers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("emptyCustomers")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("currency")}</TableHead>
                    <TableHead>{t("sites")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        <Building2 className="mr-1 inline size-3.5 text-muted-foreground" />
                        {customer.name}
                      </TableCell>
                      <TableCell>{customer.currency}</TableCell>
                      <TableCell>{customer.sites_count ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}