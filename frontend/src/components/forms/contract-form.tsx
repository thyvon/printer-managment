"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, FormProvider, type Resolver } from "react-hook-form";
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
import { ApiError } from "@/lib/api";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { FormCombobox } from "@/components/form-combobox";
import { FormDatePicker } from "@/components/form-date-picker";
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

  const methods = useForm<FormValues>({
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
    control: methods.control,
    name: "pricing_tiers",
  });

  useEffect(() => {
    if (open) {
      methods.reset({
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
  }, [open, contract, customers, methods.reset]);

  const onSubmit = async (values: FormValues) => {
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
      toast.success(contract ? t("editTitle") : t("createTitle"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError(tCommon("errors.generic"));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {contract ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormCombobox
                name="customer_id"
                label={t("fields.customer")}
                required
                options={customers.map((c) => ({ label: c.name, value: String(c.id) }))}
                placeholder={t("fields.customer")}
              />
            <FormField name="name" label={t("fields.name")} required>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormCombobox
                name="status"
                label={t("fields.status")}
                required
                options={[
                  { label: tCommon("status.active"), value: "active" },
                  { label: tCommon("status.pending"), value: "pending" },
                  { label: tCommon("status.expired"), value: "expired" },
                  { label: tCommon("status.cancelled"), value: "cancelled" },
                ]}
              />
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
            <FormDatePicker
                control={methods.control}
                name="start_date"
                label={t("fields.startDate")}
              />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormDatePicker
                control={methods.control}
                name="end_date"
                label={t("fields.endDate")}
              />
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
                <FormCombobox
                    name={`pricing_tiers.${index}.currency`}
                    label={t("tierFields.currency")}
                    required
                    options={[
                      { label: "USD ($)", value: "USD" },
                      { label: "KHR (៛)", value: "KHR" },
                    ]}
                  />
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
            <Button type="submit" disabled={methods.formState.isSubmitting}>
              {methods.formState.isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}