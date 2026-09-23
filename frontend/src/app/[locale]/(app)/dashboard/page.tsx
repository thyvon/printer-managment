"use client";

import { useTranslations } from "next-intl";
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
import { fmtPeriod } from "@/lib/dates";
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
  AlertTriangle,
  Hammer,
} from "lucide-react";

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "KHR" ? "៛" : "$";
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function DashboardPage() {
  const t = useTranslations("Dashboard");

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

  function tonerColorBar(percent: number) {
    if (percent <= 10) return "bg-red-500";
    if (percent <= 20) return "bg-amber-500";
    return "bg-green-500";
  }

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              {t("lowStockToners")}
            </CardTitle>
            <Link href="/toners" className="text-sm text-muted-foreground hover:text-foreground">
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.low_stock_toners.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("emptyToners")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tonerName")}</TableHead>
                    <TableHead>{t("stock")}</TableHead>
                    <TableHead>{t("threshold")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.low_stock_toners.map((toner) => (
                    <TableRow key={toner.id}>
                      <TableCell className="font-medium">{toner.name}</TableCell>
                      <TableCell>
                        <span className="text-destructive font-medium">{toner.current_stock}</span> {toner.unit}
                      </TableCell>
                      <TableCell>{toner.low_stock_threshold} {toner.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Printer className="size-4 text-amber-500" />
              {t("lowTonerAlerts")}
            </CardTitle>
            <Link href="/printers" className="text-sm text-muted-foreground hover:text-foreground">
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.low_toner_printers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("emptyLowToner")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("printerName")}</TableHead>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("tonerLevels")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.low_toner_printers.map((printer) => (
                    <TableRow key={printer.id}>
                      <TableCell className="font-medium">{printer.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {printer.customer_name ?? "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          {Object.entries(printer.toner_levels).map(([color, level]) => (
                            <div key={color} className="flex items-center gap-1" title={`${color}: ${level.percent}%`}>
                              <div className="h-2 w-8 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full ${tonerColorBar(level.percent)}`} style={{ width: `${level.percent}%` }} />
                              </div>
                              <span className="text-[10px] text-muted-foreground uppercase">{color.slice(0, 1)}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Hammer className="size-4 text-blue-500" />
              {t("openTickets")}
            </CardTitle>
            <Link href="/maintenance" className="text-sm text-muted-foreground hover:text-foreground">
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.open_tickets.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("emptyTickets")}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("ticketTitle")}</TableHead>
                    <TableHead>{t("customer")}</TableHead>
                    <TableHead>{t("priority")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.open_tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.title}</TableCell>
                      <TableCell>{ticket.customer_name ?? "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.priority} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => fmtPeriod(v)} />
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
                    "USD"
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
                        {formatMoney(invoice.total, invoice.currency)}
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