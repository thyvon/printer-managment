"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { api } from "@/lib/api";
import type { Paginated, Usage } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationControls } from "@/components/pagination-controls";
import { DateRangePicker } from "@/components/date-range-picker";
import { fmtPeriod } from "@/lib/dates";

export default function UsagesPage() {
  const t = useTranslations("Usages");
  const tCommon = useTranslations("Common");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const dateParams =
    dateRange?.from && dateRange?.to
      ? `&from=${dateRange.from.toISOString()}&to=${dateRange.to.toISOString()}`
      : "";

  const { data, isLoading, isError } = useQuery({
    queryKey: ["usages", page, dateParams],
    queryFn: () =>
      api.get<Paginated<Usage>>(
        `/usages?page=${page}${dateParams}`
      ),
  });

  if (isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const printerName = (usage: Usage) =>
    usage.printer?.name ?? `#${usage.printer_id}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <DateRangePicker
            range={dateRange}
            onChange={(r) => {
              setDateRange(r);
              setPage(1);
            }}
            label={t("filterMonth")}
          />
        }
      />

      <Card>
        <CardContent className="p-0">
          {data.data.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("printer")}</TableHead>
                  <TableHead>{t("period")}</TableHead>
                  <TableHead>{t("totalPages")}</TableHead>
                  <TableHead>{t("monoPages")}</TableHead>
                  <TableHead>{t("colorPages")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((usage) => (
                  <TableRow key={usage.id}>
                    <TableCell className="font-medium">{printerName(usage)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtPeriod(usage.period_start, usage.period_end)}
                    </TableCell>
                    <TableCell>{usage.total_pages.toLocaleString()}</TableCell>
                    <TableCell>{usage.mono_pages.toLocaleString()}</TableCell>
                    <TableCell>{usage.color_pages.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationControls setPage={setPage} data={data} />
    </div>
  );
}
