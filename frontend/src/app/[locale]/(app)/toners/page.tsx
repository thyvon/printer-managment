"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Paginated, Toner } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
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
import { StatusBadge } from "@/components/status-badge";
import { TonerForm } from "@/components/forms/toner-form";
import { Pencil, Plus, Trash2, Package } from "lucide-react";

export default function TonersPage() {
  const t = useTranslations("Toners");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Toner | null>(null);
  const [deleting, setDeleting] = useState<Toner | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["toners", page, showLowStock],
    queryFn: () =>
      api.get<Paginated<Toner>>(
        `/toners?page=${page}${showLowStock ? "&low_stock=true" : ""}`
      ),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["toners"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/toners/${id}`),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
    },
  });

  if (isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const colorLabels: Record<string, string> = {
    black: t("colors.black"),
    cyan: t("colors.cyan"),
    magenta: t("colors.magenta"),
    yellow: t("colors.yellow"),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => setShowLowStock(!showLowStock)}
              className={showLowStock ? "bg-primary text-primary-foreground" : ""}
            >
              <Package data-icon="inline-start" className="size-3.5" />
              {showLowStock ? t("actions.showAll") : t("actions.lowStockOnly")}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus data-icon="inline-start" />
              {t("actions.create")}
            </Button>
          </>
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
                  <TableHead>{t("fields.partNumber")}</TableHead>
                  <TableHead>{t("fields.color")}</TableHead>
                  <TableHead>{t("fields.printerModels")}</TableHead>
                  <TableHead className="text-right">{t("fields.currentStock")}</TableHead>
                  <TableHead className="text-right">{t("fields.lowStockThreshold")}</TableHead>
                  <TableHead>{t("fields.status")}</TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((toner) => (
                  <TableRow key={toner.id}>
                    <TableCell className="font-medium">{toner.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {toner.part_number ?? "-"}
                    </TableCell>
                    <TableCell>
                      {toner.color ? (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={`size-2 rounded-full ${
                              toner.color === "black"
                                ? "bg-gray-800"
                                : toner.color === "cyan"
                                ? "bg-cyan-500"
                                : toner.color === "magenta"
                                ? "bg-fuchsia-500"
                                : "bg-yellow-500"
                            }`}
                          />
                          {colorLabels[toner.color] ?? toner.color}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                      {toner.printer_models ?? "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {toner.current_stock} {toner.unit}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {toner.low_stock_threshold} {toner.unit}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={toner.is_low_stock ? "low_stock" : "in_stock"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={tCommon("edit")}
                          onClick={() => {
                            setEditing(toner);
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
                          onClick={() => setDeleting(toner)}
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

      <TonerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        toner={editing}
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