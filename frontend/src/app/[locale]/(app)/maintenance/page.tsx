"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Paginated, ServiceTicket } from "@/lib/types";
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
import { ServiceTicketForm } from "@/components/forms/service-ticket-form";
import { useCustomerOptions, useSiteOptions, usePrinterOptions, useUserOptions } from "@/hooks/use-options";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function MaintenancePage() {
  const t = useTranslations("Maintenance");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const customerFilter = searchParams.get("customer_id");
  const statusFilter = searchParams.get("status");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceTicket | null>(null);
  const [deleting, setDeleting] = useState<ServiceTicket | null>(null);

  const customersQuery = useCustomerOptions();
  const sitesQuery = useSiteOptions();
  const printersQuery = usePrinterOptions();
  const usersQuery = useUserOptions();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["service-tickets", page, customerFilter, statusFilter],
    queryFn: () =>
      api.get<Paginated<ServiceTicket>>(
        `/service-tickets?page=${page}${customerFilter ? `&customer_id=${customerFilter}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}`
      ),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["service-tickets"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/service-tickets/${id}`),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
    },
  });

  if (isLoading || customersQuery.isLoading || sitesQuery.isLoading || printersQuery.isLoading || usersQuery.isLoading)
    return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const customerName = (id: number) =>
    customersQuery.data?.find((c) => c.id === id)?.name ?? `#${id}`;

  const siteName = (id: number | null) =>
    id == null
      ? "-"
      : sitesQuery.data?.find((s) => s.id === id)?.name ?? `#${id}`;

  const printerName = (id: number | null) =>
    id == null
      ? "-"
      : printersQuery.data?.find((p) => p.id === id)?.name ?? `#${id}`;

  const userName = (id: number | null) =>
    id == null
      ? "-"
      : usersQuery.data?.find((u) => u.id === id)?.name ?? `#${id}`;

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
                  <TableHead>{t("fields.title")}</TableHead>
                  <TableHead>{t("fields.customer")}</TableHead>
                  <TableHead>{t("fields.site")}</TableHead>
                  <TableHead>{t("fields.printer")}</TableHead>
                  <TableHead>{t("fields.status")}</TableHead>
                  <TableHead>{t("fields.priority")}</TableHead>
                  <TableHead>{t("fields.assignedUser")}</TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {customerName(ticket.customer_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {siteName(ticket.site_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {printerName(ticket.printer_id)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.priority} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {userName(ticket.assigned_user_id)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={tCommon("edit")}
                          onClick={() => {
                            setEditing(ticket);
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
                          onClick={() => setDeleting(ticket)}
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

      <ServiceTicketForm
        open={formOpen}
        onOpenChange={setFormOpen}
        ticket={editing}
        customers={customersQuery.data ?? []}
        sites={sitesQuery.data ?? []}
        printers={data.data.flatMap((t) => t.printer ? [t.printer] : [])}
        users={usersQuery.data ?? []}
        onSuccess={invalidate}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("deleteTitle")}
        description={t("deleteDescription", { name: deleting?.title ?? "" })}
        busy={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
      />
    </div>
  );
}