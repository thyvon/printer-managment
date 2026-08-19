"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { Contract, Customer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ApiError } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const tierSchema = z.object({
  name: z.string().min(2),
  currency: z.enum(["USD", "KHR"]),
  included_mono_pages: z.coerce.number().min(0),
  included_color_pages: z.coerce.number().min(0),
  mono_rate: z.coerce.number().min(0),
  color_rate: z.coerce.number().min(0),
});

const schema = z.object({
  customer_id: z.coerce.number().min(1),
  name: z.string().min(2),
  status: z.enum(["active", "pending", "expired", "cancelled"]),
  monthly_fee: z.coerce.number().min(0).optional(),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
  pricing_tiers: z.array(tierSchema).min(1),
});

type FormValues = z.infer<typeof schema>;

export function ContractForm({
  open,
  onOpenChange,
  contract,
  customers,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: Contract | null;
  customers: Customer[];
  onSuccess?: () => void;
}) {
  const t = useTranslations("Contracts");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      customer_id: customers[0]?.id ?? 0,
      name: "",
      status: "active",
      monthly_fee: undefined,
      start_date: "",
      end_date: "",
      pricing_tiers: [
        {
          name: "Tier 1",
          currency: "USD",
          included_mono_pages: 0,
          included_color_pages: 0,
          mono_rate: 0,
          color_rate: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pricing_tiers",
  });

  useEffect(() => {
    if (open) {
      reset({
        customer_id: contract?.customer_id ?? customers[0]?.id ?? 0,
        name: contract?.name ?? "",
        status: contract?.status ?? "active",
        monthly_fee: contract?.monthly_fee ? Number(contract.monthly_fee) : undefined,
        start_date: contract?.start_date ?? "",
        end_date: contract?.end_date ?? "",
        pricing_tiers:
          contract?.pricing_tiers && contract.pricing_tiers.length > 0
            ? contract.pricing_tiers.map((tier) => ({
                name: tier.name,
                currency: tier.currency,
                included_mono_pages: tier.included_mono_pages,
                included_color_pages: tier.included_color_pages,
                mono_rate: Number(tier.mono_rate),
                color_rate: Number(tier.color_rate),
              }))
            : [
                {
                  name: "Tier 1",
                  currency: "USD",
                  included_mono_pages: 0,
                  included_color_pages: 0,
                  mono_rate: 0,
                  color_rate: 0,
                },
              ],
      });
    }
  }, [open, contract, customers, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const payload = {
      ...values,
      monthly_fee: values.monthly_fee ?? 0,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
    };
    try {
      if (contract) {
        await api.patch<Contract>(`/contracts/${contract.id}`, payload);
      } else {
        await api.post<Contract>("/contracts", payload);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError(tCommon("errors.generic"));
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {contract ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="customer_id" label={t("fields.customer")} required>
              {({ id, value, onChange }) => (
                <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={String(customer.id)}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField name="name" label={t("fields.name")} required>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField name="status" label={t("fields.status")} required>
              {({ id, value, onChange }) => (
                <Select value={value as string} onValueChange={(v) => onChange(v)}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{tCommon("status.active")}</SelectItem>
                    <SelectItem value="pending">{tCommon("status.pending")}</SelectItem>
                    <SelectItem value="expired">{tCommon("status.expired")}</SelectItem>
                    <SelectItem value="cancelled">{tCommon("status.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormField>
            <FormField name="monthly_fee" label={t("fields.monthlyFee")}>
              {({ id, ...props }) => (
                <Input
                  id={id}
                  type="number"
                  step="0.01"
                  {...props}
                  value={props.value as number}
                />
              )}
            </FormField>
            <FormField name="start_date" label={t("fields.startDate")}>
              {({ id, ...props }) => (
                <Input id={id} type="date" {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="end_date" label={t("fields.endDate")}>
              {({ id, ...props }) => (
                <Input id={id} type="date" {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{t("fields.pricingTiers")}</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    name: `Tier ${fields.length + 1}`,
                    currency: "USD",
                    included_mono_pages: 0,
                    included_color_pages: 0,
                    mono_rate: 0,
                    color_rate: 0,
                  })
                }
              >
                <Plus />
                {t("actions.addTier")}
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2"
              >
                <FormField
                  name={`pricing_tiers.${index}.name`}
                  label={t("tierFields.name")}
                  required
                >
                  {({ id, ...props }) => (
                    <Input id={id} {...props} value={props.value as string} />
                  )}
                </FormField>
                <FormField
                  name={`pricing_tiers.${index}.currency`}
                  label={t("tierFields.currency")}
                  required
                >
                  {({ id, value, onChange }) => (
                    <Select value={value as string} onValueChange={(v) => onChange(v)}>
                      <SelectTrigger id={id} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="KHR">KHR (៛)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </FormField>
                <FormField
                  name={`pricing_tiers.${index}.included_mono_pages`}
                  label={t("tierFields.includedMono")}
                >
                  {({ id, ...props }) => (
                    <Input id={id} type="number" {...props} value={props.value as number} />
                  )}
                </FormField>
                <FormField
                  name={`pricing_tiers.${index}.included_color_pages`}
                  label={t("tierFields.includedColor")}
                >
                  {({ id, ...props }) => (
                    <Input id={id} type="number" {...props} value={props.value as number} />
                  )}
                </FormField>
                <FormField
                  name={`pricing_tiers.${index}.mono_rate`}
                  label={t("tierFields.monoRate")}
                >
                  {({ id, ...props }) => (
                    <Input id={id} type="number" step="0.001" {...props} value={props.value as number} />
                  )}
                </FormField>
                <FormField
                  name={`pricing_tiers.${index}.color_rate`}
                  label={t("tierFields.colorRate")}
                >
                  {({ id, ...props }) => (
                    <Input id={id} type="number" step="0.001" {...props} value={props.value as number} />
                  )}
                </FormField>
                {fields.length > 1 && (
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 />
                      {t("actions.removeTier")}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {serverError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}