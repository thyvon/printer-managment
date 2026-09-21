"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Paginated } from "@/lib/types";
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
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AuditLogEntry = {
  id: number;
  user_id: number | null;
  auditable_type: string;
  auditable_id: number;
  event: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  user?: { id: number; name: string; email: string };
};

export default function AuditLogsPage() {
  const t = useTranslations("AuditLogs");
  const tCommon = useTranslations("Common");
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", page, eventFilter, modelFilter],
    queryFn: () =>
      api.get<Paginated<AuditLogEntry>>(
        `/audit-logs?page=${page}${eventFilter ? `&event=${eventFilter}` : ""}${modelFilter ? `&auditable_type=${modelFilter}` : ""}`
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

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="flex gap-4">
        <div className="w-48">
          <p className="text-sm font-medium mb-1.5">{t("filterEvent")}</p>
          <Select value={eventFilter || "all"} onValueChange={(val) => { setEventFilter(val === "all" ? "" : val ?? ""); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder={t("allEvents")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allEvents")}</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <p className="text-sm font-medium mb-1.5">{t("filterModel")}</p>
          <Select value={modelFilter || "all"} onValueChange={(val) => { setModelFilter(val === "all" ? "" : val ?? ""); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder={t("allModels")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allModels")}</SelectItem>
              <SelectItem value="Customer">Customer</SelectItem>
              <SelectItem value="Site">Site</SelectItem>
              <SelectItem value="Printer">Printer</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="Toner">Toner</SelectItem>
              <SelectItem value="ServiceTicket">ServiceTicket</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("timestamp")}</TableHead>
                <TableHead>{t("user")}</TableHead>
                <TableHead>{t("event")}</TableHead>
                <TableHead>{t("model")}</TableHead>
                <TableHead>{t("recordId")}</TableHead>
                <TableHead>{t("changes")}</TableHead>
                <TableHead>{t("ipAddress")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.user?.name ?? "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={log.event} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.auditable_type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">#{log.auditable_id}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                      {log.event === "created" && log.new_values
                        ? Object.keys(log.new_values).join(", ")
                        : log.event === "deleted" && log.old_values
                          ? Object.keys(log.old_values).join(", ")
                          : log.event === "updated" && log.old_values
                            ? Object.keys(log.old_values).join(", ")
                            : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {log.ip_address ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaginationControls setPage={setPage} data={data} />
    </div>
  );
}
