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
import { fmtDateTime } from "@/lib/dates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

function ChangesDiff({ oldValues, newValues }: { oldValues: Record<string, unknown> | null; newValues: Record<string, unknown> | null }) {
  const allKeys = [
    ...Object.keys(oldValues ?? {}),
    ...Object.keys(newValues ?? {}),
  ];
  const uniqueKeys = [...new Set(allKeys)];

  if (uniqueKeys.length === 0) {
    return <p className="text-sm text-muted-foreground">No changes recorded.</p>;
  }

  return (
    <div className="space-y-2">
      {uniqueKeys.map((key) => {
        const oldVal = oldValues?.[key];
        const newVal = newValues?.[key];
        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

        return (
          <div key={key} className="rounded-md border p-2.5">
            <p className="text-xs font-medium text-muted-foreground mb-1">{key}</p>
            {changed ? (
              <div className="flex items-center gap-2 text-sm">
                {oldVal !== undefined && (
                  <span className="line-through text-destructive/80">
                    {typeof oldVal === "object" ? JSON.stringify(oldVal) : String(oldVal)}
                  </span>
                )}
                <span className="text-muted-foreground">→</span>
                {newVal !== undefined && (
                  <span className="text-green-600 dark:text-green-400">
                    {typeof newVal === "object" ? JSON.stringify(newVal) : String(newVal)}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm">
                {typeof (newVal ?? oldVal) === "object"
                  ? JSON.stringify(newVal ?? oldVal)
                  : String(newVal ?? oldVal ?? "")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditLogsPage() {
  const t = useTranslations("AuditLogs");
  const tCommon = useTranslations("Common");
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState<string>("");
  const [modelFilter, setModelFilter] = useState<string>("");
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

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
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
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
              <SelectItem value="Contract">Contract</SelectItem>
              <SelectItem value="Contact">Contact</SelectItem>
              <SelectItem value="Collector">Collector</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="Toner">Toner</SelectItem>
              <SelectItem value="ServiceTicket">ServiceTicket</SelectItem>
              <SelectItem value="User">User</SelectItem>
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
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelected(log)}
                  >
                    <TableCell className="text-muted-foreground text-xs">
                      {fmtDateTime(log.created_at)}
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

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("detailTitle")}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">{t("timestamp")}</p>
                  <p>{fmtDateTime(selected.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("user")}</p>
                  <p>{selected.user?.name ?? "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("event")}</p>
                  <StatusBadge status={selected.event} />
                </div>
                <div>
                  <p className="text-muted-foreground">{t("model")}</p>
                  <Badge variant="outline">{selected.auditable_type}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("recordId")}</p>
                  <p>#{selected.auditable_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("ipAddress")}</p>
                  <p>{selected.ip_address ?? "-"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">{t("detailChanges")}</p>
                <ChangesDiff oldValues={selected.old_values} newValues={selected.new_values} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
