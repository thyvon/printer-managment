"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { api, ApiError } from "@/lib/api";
import type { Customer, Invoice, Paginated } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "@/components/form-field";
import { PaginationControls } from "@/components/pagination-controls";
import { useCustomerOptions } from "@/hooks/use-options";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";

const generateSchema = z.object({
  customer_id: z.number().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

type GenerateValues = z.infer<typeof generateSchema>;

function formatMoney(amount: number, currency: string) {
  const symbol = currency === "KHR" ? "៛" : "$";
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function InvoicesPage() {
  const t = useTranslations("Invoices");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const customersQuery = useCustomerOptions();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoices", page],
    queryFn: () => api.get<Paginated<Invoice>>(`/invoices?page=${page}`),
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<GenerateValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      customer_id: 0,
      month: "",
    },
  });

  const generateMutation = useMutation({
    mutationFn: (values: GenerateValues) =>
      api.post<Invoice>("/invoices/generate", values),
    onSuccess: () => {
      setGenerateOpen(false);
      setServerError(null);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError(tCommon("errors.generic"));
      }
    },
  });

  const onGenerate = handleSubmit((values) => {
    setServerError(null);
    generateMutation.mutate(values);
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
              reset({ customer_id: customersQuery.data?.[0]?.id ?? 0, month: "" });
              setServerError(null);
              setGenerateOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            {t("actions.generate")}
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
                  <TableHead>{t("invoiceNumber")}</TableHead>
                  <TableHead>{t("customer")}</TableHead>
                  <TableHead>{t("period")}</TableHead>
                  <TableHead>{t("total")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/invoices/${invoice.id}`}
                        className="hover:underline"
                      >
                        {invoice.invoice_number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.customer?.name ?? customerName(invoice.customer_id)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {invoice.period_start} — {invoice.period_end}
                    </TableCell>
                    <TableCell>
                      {formatMoney(invoice.total, invoice.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invoice.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PaginationControls setPage={setPage} data={data} />

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("generateTitle")}</DialogTitle>
            <DialogDescription>{t("generateDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onGenerate} className="grid gap-4">
            <FormField name="customer_id" label={t("customer")} required>
              {({ id, value, onChange }) => (
                <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customersQuery.data?.map((customer: Customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField name="month" label={t("month")} required>
              {({ id, ...props }) => (
                <Input
                  id={id}
                  type="month"
                  {...props}
                  value={props.value as string}
                />
              )}
            </FormField>

            {serverError ? (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGenerateOpen(false)}
              >
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || generateMutation.isPending}
              >
                {isSubmitting || generateMutation.isPending
                  ? tCommon("saving")
                  : t("actions.generate")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}