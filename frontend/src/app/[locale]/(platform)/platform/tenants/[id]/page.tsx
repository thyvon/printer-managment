"use client";

import { useTranslations } from "next-intl";
import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import type { TenantDetail } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FormCombobox } from "@/components/form-combobox";
import { FormField } from "@/components/form-field";
import { Input } from "@/components/ui/input";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const planSchema = z.object({
  plan: z.enum(["starter", "growth", "enterprise"]),
  device_limit: z.number().min(1),
  status: z.enum(["active", "trial", "suspended"]).optional(),
});

type PlanValues = z.infer<typeof planSchema>;

export default function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = useTranslations("Platform");
  const tCommon = useTranslations("Common");
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["platform-tenant", id],
    queryFn: () => api.get<TenantDetail>(`/platform/tenants/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: (values: PlanValues) =>
      api.patch(`/platform/tenants/${id}/plan`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-tenant", id] });
      queryClient.invalidateQueries({ queryKey: ["platform-tenants"] });
      toast.success(t("planUpdated"));
      setEditOpen(false);
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
      <Link
        href="/platform/tenants"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "-ml-2 w-fit"
        )}
      >
        <ArrowLeft />
        {t("backToTenants")}
      </Link>

      <PageHeader
        title={data.name}
        description={data.slug}
        actions={
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            {t("editPlan")}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("plan")}</CardTitle>
          </CardHeader>
          <CardContent><StatusBadge status={data.plan} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("status")}</CardTitle>
          </CardHeader>
          <CardContent><StatusBadge status={data.status} /></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("users")}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{data.users_count}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("printers")}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{data.printers_count}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">{t("customers")}</CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-semibold">{data.customers_count}</p></CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentUsers")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("email")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><StatusBadge status={user.role} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentInvoices")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("total")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_invoices?.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.currency} {invoice.total}</TableCell>
                    <TableCell><StatusBadge status={invoice.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <EditPlanDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tenant={data}
        onSubmit={(values) => updateMutation.mutate(values)}
        isSubmitting={updateMutation.isPending}
        t={t}
        tCommon={tCommon}
      />
    </div>
  );
}

function EditPlanDialog({
  open,
  onOpenChange,
  tenant,
  onSubmit,
  isSubmitting,
  t,
  tCommon,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: TenantDetail;
  onSubmit: (values: PlanValues) => void;
  isSubmitting: boolean;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const methods = useForm<PlanValues>({
    resolver: zodResolver(planSchema) as Resolver<PlanValues>,
    defaultValues: {
      plan: tenant.plan as "starter" | "growth" | "enterprise",
      device_limit: tenant.device_limit,
      status: tenant.status as "active" | "trial" | "suspended",
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editPlan")}</DialogTitle>
          <DialogDescription>{t("editPlanDescription")}</DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-4">
            <FormCombobox
              name="plan"
              label={t("plan")}
              required
              options={[
                { label: "Starter (up to 20 devices)", value: "starter" },
                { label: "Growth (up to 100 devices)", value: "growth" },
                { label: "Enterprise (100+ devices)", value: "enterprise" },
              ]}
            />

            <FormField name="device_limit" label={t("deviceLimit")} required>
              {({ id, ...props }) => (
                <Input id={id} type="number" {...props} value={props.value as number} />
              )}
            </FormField>

            <FormCombobox
              name="status"
              label={t("status")}
              options={[
                { label: "Active", value: "active" },
                { label: "Trial", value: "trial" },
                { label: "Suspended", value: "suspended" },
              ]}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tCommon("saving") : tCommon("save")}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
