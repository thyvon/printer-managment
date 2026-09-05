"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Customer, Paginated } from "@/lib/types";
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
import { CustomerForm } from "@/components/forms/customer-form";
import { Link } from "@/i18n/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";

export default function CustomersPage() {
  const t = useTranslations("Customers");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["customers", page],
    queryFn: () => api.get<Paginated<Customer>>(`/customers?page=${page}`),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["customers"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/customers/${id}`),
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
                  <TableHead>{t("fields.email")}</TableHead>
                  <TableHead>{t("fields.currency")}</TableHead>
                  <TableHead>{t("sitesCount")}</TableHead>
                  <TableHead>{t("fields.status")}</TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/sites?customer_id=${customer.id}`}
                        className="hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {customer.email ?? "-"}
                    </TableCell>
                    <TableCell>{customer.currency}</TableCell>
                    <TableCell>{customer.sites_count ?? 0}</TableCell>
                    <TableCell>
                      <StatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={tCommon("edit")}
                          onClick={() => {
                            setEditing(customer);
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
                          onClick={() => setDeleting(customer)}
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

      <PaginationControls
        setPage={setPage}
        data={data}
      />

      <CustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editing}
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