"use client";

import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Company, Paginated } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/navigation";
import { PaginationControls } from "@/components/pagination-controls";
import { useState } from "react";

type TenantRow = Company & {
  users_count: number;
  printers_count: number;
  customers_count: number;
};

export default function TenantsPage() {
  const t = useTranslations("Platform");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-tenants", page],
    queryFn: () => api.get<Paginated<TenantRow>>(`/platform/tenants?page=${page}`),
  });

  if (isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {t("loadError")}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("tenantsTitle")} description={t("tenantsSubtitle")} />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tenantName")}</TableHead>
                <TableHead>{t("plan")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("users")}</TableHead>
                <TableHead>{t("printers")}</TableHead>
                <TableHead>{t("customers")}</TableHead>
                <TableHead>{t("created")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    {t("noTenants")}
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">
                      <Link href={`/platform/tenants/${tenant.id}`} className="hover:underline">
                        {tenant.name}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={tenant.plan} /></TableCell>
                    <TableCell><StatusBadge status={tenant.status} /></TableCell>
                    <TableCell>{tenant.users_count}</TableCell>
                    <TableCell>{tenant.printers_count}</TableCell>
                    <TableCell>{tenant.customers_count}</TableCell>
                    <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaginationControls
        setPage={setPage}
        data={data}
      />
    </div>
  );
}
