"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DateRangePicker } from "@/components/date-range-picker";
import { fmtPeriod } from "@/lib/dates";

type UsageReport = {
  total_pages: number;
  total_mono: number;
  total_color: number;
  avg_pages_per_printer: number;
  periods: {
    period_start: string;
    period_end: string;
    total_pages: number;
    mono_pages: number;
    color_pages: number;
    printer_count: number;
  }[];
};

type RevenueReport = {
  total_revenue_usd: number;
  total_revenue_khr: number;
  total_subtotal_usd: number;
  total_subtotal_khr: number;
  total_tax_usd: number;
  total_tax_khr: number;
  total_invoices: number;
  paid_invoices: number;
  overdue_invoices: number;
  periods: {
    period_start: string;
    period_end: string;
    currency: string;
    total: number;
    subtotal: number;
    tax: number;
    invoice_count: number;
    paid_count: number;
    overdue_count: number;
  }[];
};

type FleetReport = {
  total_printers: number;
  by_status: { status: string; count: number }[];
  by_manufacturer: { manufacturer: string; count: number }[];
  by_customer: { customer: string; count: number }[];
  by_site: { site: string; city: string; count: number }[];
  low_stock_toners: number;
  open_tickets: number;
};

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "KHR" ? "៛" : "$";
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function ReportsPage() {
  const t = useTranslations("Reports");
  const tCommon = useTranslations("Common");
  const [tab, setTab] = useState<"usage" | "revenue" | "fleet">("usage");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const dateParams = dateRange?.from && dateRange?.to
    ? `?from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
    : "";

  const usageQuery = useQuery({
    queryKey: ["reports", "usage", dateParams],
    queryFn: () => api.get<UsageReport>(`/reports/usage${dateParams}`),
    enabled: tab === "usage",
  });

  const revenueQuery = useQuery({
    queryKey: ["reports", "revenue", dateParams],
    queryFn: () => api.get<RevenueReport>(`/reports/revenue${dateParams}`),
    enabled: tab === "revenue",
  });

  const fleetQuery = useQuery({
    queryKey: ["reports", "fleet"],
    queryFn: () => api.get<FleetReport>("/reports/fleet"),
    enabled: tab === "fleet",
  });

  const tabs = [
    { key: "usage" as const, label: t("tabs.usage") },
    { key: "revenue" as const, label: t("tabs.revenue") },
    { key: "fleet" as const, label: t("tabs.fleet") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 rounded-lg border bg-muted p-1">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === tb.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tb.label}
            </button>
          ))}
        </div>

        {tab !== "fleet" && (
          <DateRangePicker
            range={dateRange}
            onChange={setDateRange}
            label={t("allTime")}
          />
        )}
      </div>

      {tab === "usage" && (
        <UsageReportView query={usageQuery} t={t} tCommon={tCommon} />
      )}
      {tab === "revenue" && (
        <RevenueReportView query={revenueQuery} t={t} tCommon={tCommon} />
      )}
      {tab === "fleet" && (
        <FleetReportView query={fleetQuery} t={t} tCommon={tCommon} />
      )}
    </div>
  );
}

function UsageReportView({
  query,
  t,
  tCommon,
}: {
  query: ReturnType<typeof useQuery<UsageReport>>;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  if (query.isLoading) return <PageLoading />;
  if (query.isError || !query.data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("totalPages")}</p>
            <p className="text-2xl font-semibold">
              {data.total_pages.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("monoPages")}</p>
            <p className="text-2xl font-semibold">
              {data.total_mono.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("colorPages")}</p>
            <p className="text-2xl font-semibold">
              {data.total_color.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("avgPagesPerPrinter")}</p>
            <p className="text-2xl font-semibold">
              {data.avg_pages_per_printer.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("usageTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.periods}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period_start" fontSize={12} tickFormatter={(v) => fmtPeriod(v)} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="mono_pages" name="Mono" fill="#6b7280" radius={[4, 4, 0, 0]} />
                <Bar dataKey="color_pages" name="Color" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {data.periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("usageDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("period")}</TableHead>
                  <TableHead className="text-right">{t("totalPages")}</TableHead>
                  <TableHead className="text-right">{t("monoPages")}</TableHead>
                  <TableHead className="text-right">{t("colorPages")}</TableHead>
                  <TableHead className="text-right">{t("printers")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.periods.map((p) => (
                  <TableRow key={p.period_start}>
                    <TableCell>
                      {fmtPeriod(p.period_start, p.period_end)}
                    </TableCell>
                    <TableCell className="text-right">{p.total_pages.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{p.mono_pages.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{p.color_pages.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{p.printer_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RevenueReportView({
  query,
  t,
  tCommon,
}: {
  query: ReturnType<typeof useQuery<RevenueReport>>;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  if (query.isLoading) return <PageLoading />;
  if (query.isError || !query.data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("revenueUSD")}</p>
            <p className="text-2xl font-semibold">
              {formatMoney(data.total_revenue_usd, "USD")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("revenueKHR")}</p>
            <p className="text-2xl font-semibold">
              {formatMoney(data.total_revenue_khr, "KHR")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("totalInvoices")}</p>
            <p className="text-2xl font-semibold">{data.total_invoices}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("overdueInvoices")}</p>
            <p className="text-2xl font-semibold text-destructive">
              {data.overdue_invoices}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("revenueTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.periods}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period_start" fontSize={12} tickFormatter={(v) => fmtPeriod(v)} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {data.periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("revenueDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("period")}</TableHead>
                  <TableHead>{t("currency")}</TableHead>
                  <TableHead className="text-right">{t("total")}</TableHead>
                  <TableHead className="text-right">{t("invoices")}</TableHead>
                  <TableHead className="text-right">{t("paid")}</TableHead>
                  <TableHead className="text-right">{t("overdue")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.periods.map((p) => (
                  <TableRow key={`${p.period_start}-${p.currency}`}>
                    <TableCell>
                      {fmtPeriod(p.period_start, p.period_end)}
                    </TableCell>
                    <TableCell>{p.currency}</TableCell>
                    <TableCell className="text-right">
                      {formatMoney(p.total, p.currency)}
                    </TableCell>
                    <TableCell className="text-right">{p.invoice_count}</TableCell>
                    <TableCell className="text-right">{p.paid_count}</TableCell>
                    <TableCell className="text-right text-destructive">
                      {p.overdue_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FleetReportView({
  query,
  t,
  tCommon,
}: {
  query: ReturnType<typeof useQuery<FleetReport>>;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  if (query.isLoading) return <PageLoading />;
  if (query.isError || !query.data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const data = query.data;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("totalPrinters")}</p>
            <p className="text-2xl font-semibold">{data.total_printers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("openTickets")}</p>
            <p className="text-2xl font-semibold">{data.open_tickets}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("lowStockToners")}</p>
            <p className="text-2xl font-semibold text-destructive">
              {data.low_stock_toners}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t("manufacturers")}</p>
            <p className="text-2xl font-semibold">
              {data.by_manufacturer.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.by_status.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("printersByStatus")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.by_status}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Printers" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.by_manufacturer.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("printersByManufacturer")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.by_manufacturer}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="manufacturer" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Printers" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {data.by_customer.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("printersByCustomer")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead className="text-right">{t("printers")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_customer.map((row) => (
                    <TableRow key={row.customer}>
                      <TableCell>{row.customer}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {data.by_site.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("topSites")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("site")}</TableHead>
                    <TableHead>{t("city")}</TableHead>
                    <TableHead className="text-right">{t("printers")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_site.map((row) => (
                    <TableRow key={row.site}>
                      <TableCell>{row.site}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.city ?? "-"}
                      </TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
