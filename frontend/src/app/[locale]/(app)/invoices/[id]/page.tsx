"use client";

import { useTranslations } from "next-intl";
import { use, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Invoice } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { buttonVariants } from "@/components/ui/button";
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
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtPeriod } from "@/lib/dates";

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "KHR" ? "៛" : "$";
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("Invoices");
  const tCommon = useTranslations("Common");
  const { id } = use(params);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoices", id],
    queryFn: () => api.get<Invoice>(`/invoices/${id}`),
  });

  const pageTitle = useMemo(() => data?.invoice_number ?? t("title"), [data, t]);

  if (isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/invoices"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeft />
        {t("backToInvoices")}
      </Link>

      <PageHeader title={pageTitle} description={data.customer?.name} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("summary")}</CardTitle>
          <StatusBadge status={data.status} />
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">{t("period")}</p>
            <p className="text-sm font-medium">
              {fmtPeriod(data.period_start, data.period_end)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("currency")}</p>
            <p className="text-sm font-medium">{data.currency}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("subtotal")}</p>
            <p className="text-sm font-medium">
              {formatMoney(data.subtotal, data.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("tax")}</p>
            <p className="text-sm font-medium">{formatMoney(data.tax, data.currency)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("lines")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("description")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("unitPrice")}</TableHead>
                <TableHead className="text-right">{t("amount")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.lines ?? []).map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.description}</TableCell>
                  <TableCell>{line.quantity}</TableCell>
                  <TableCell>{formatMoney(line.unit_price, line.currency)}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(line.amount, line.currency)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  {t("total")}
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {formatMoney(data.total, data.currency)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}