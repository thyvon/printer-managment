"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Paginated, Printer } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PrinterForm } from "@/components/forms/printer-form";
import { useSiteOptions } from "@/hooks/use-options";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function PrintersPage() {
  const t = useTranslations("Printers");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Printer | null>(null);
  const [deleting, setDeleting] = useState<Printer | null>(null);

  const sitesQuery = useSiteOptions();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["printers", page],
    queryFn: () => api.get<Paginated<Printer>>(`/printers?page=${page}`),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["printers"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/printers/${id}`),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
    },
  });

  if (isLoading || sitesQuery.isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const siteName = (id: number) =>
    sitesQuery.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            {t("actions.create")}
          </Button>
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
                  <TableHead>{t("fields.name")}</TableHead>
                  <TableHead>{t("fields.model")}</TableHead>
                  <TableHead>{t("fields.site")}</TableHead>
                  <TableHead>{t("fields.ipAddress")}</TableHead>
                  <TableHead>{t("fields.status")}</TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((printer) => (
                  <TableRow key={printer.id}>
                    <TableCell className="font-medium">{printer.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[printer.manufacturer, printer.model]
                        .filter(Boolean)
                        .join(" ") || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {siteName(printer.site_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {printer.ip_address ?? "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={printer.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={tCommon("edit")}
                          onClick={() => {
                            setEditing(printer);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={tCommon("delete")}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(printer)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationControls setPage={setPage} data={data} />

      <PrinterForm
        open={formOpen}
        onOpenChange={setFormOpen}
        printer={editing}
        sites={sitesQuery.data ?? []}
        onSuccess={invalidate}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle")}
        description={t("deleteDescription", { name: deleting?.name ?? "" })}
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}