"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Paginated, Site } from "@/lib/types";
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
import { SiteForm } from "@/components/forms/site-form";
import { useCustomerOptions } from "@/hooks/use-options";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function SitesPage() {
  const t = useTranslations("Sites");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const customerFilter = searchParams.get("customer_id");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState<Site | null>(null);

  const customersQuery = useCustomerOptions();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["sites", page, customerFilter],
    queryFn: () =>
      api.get<Paginated<Site>>(
        `/sites?page=${page}${customerFilter ? `&customer_id=${customerFilter}` : ""}`
      ),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["sites"] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/sites/${id}`),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
    },
  });

  if (isLoading || customersQuery.isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const customerName = (id: number) =>
    customersQuery.data?.find((c) => c.id === id)?.name ?? `#${id}`;

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
                  <TableHead>{t("fields.customer")}</TableHead>
                  <TableHead>{t("fields.city")}</TableHead>
                  <TableHead>{t("fields.phone")}</TableHead>
                  <TableHead className="text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="font-medium">{site.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {customerName(site.customer_id)}
                    </TableCell>
                    <TableCell>{site.city ?? "-"}</TableCell>
                    <TableCell>{site.phone ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={tCommon("edit")}
                          onClick={() => {
                            setEditing(site);
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
                          onClick={() => setDeleting(site)}
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

      <SiteForm
        open={formOpen}
        onOpenChange={setFormOpen}
        site={editing}
        customers={customersQuery.data ?? []}
        defaultCustomerId={customerFilter ? Number(customerFilter) : null}
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