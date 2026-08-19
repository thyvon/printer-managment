"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { Toner } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useEffect, useState } from "react";

const schema = z.object({
  name: z.string().min(2),
  part_number: z.string().optional().or(z.literal("")),
  color: z.enum(["black", "cyan", "magenta", "yellow"]).optional(),
  printer_models: z.string().optional().or(z.literal("")),
  current_stock: z.number().min(0).default(0),
  low_stock_threshold: z.number().min(0).default(5),
  unit: z.string().default("pcs"),
  unit_cost: z.number().min(0).optional(),
  supplier: z.string().optional().or(z.literal("")),
  supplier_part_number: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function TonerForm({
  open,
  onOpenChange,
  toner,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toner?: Toner | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Toners");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      part_number: "",
      color: "black",
      printer_models: "",
      current_stock: 0,
      low_stock_threshold: 5,
      unit: "pcs",
      unit_cost: undefined,
      supplier: "",
      supplier_part_number: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: toner?.name ?? "",
        part_number: toner?.part_number ?? "",
        color: (toner?.color as FormValues["color"]) ?? "black",
        printer_models: toner?.printer_models ?? "",
        current_stock: toner?.current_stock ?? 0,
        low_stock_threshold: toner?.low_stock_threshold ?? 5,
        unit: toner?.unit ?? "pcs",
        unit_cost: toner?.unit_cost ? Number(toner.unit_cost) : undefined,
        supplier: toner?.supplier ?? "",
        supplier_part_number: toner?.supplier_part_number ?? "",
        notes: toner?.notes ?? "",
      });
    }
  }, [open, toner, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const payload = {
      ...values,
      part_number: values.part_number || null,
      printer_models: values.printer_models || null,
      color: values.color || null,
      supplier: values.supplier || null,
      supplier_part_number: values.supplier_part_number || null,
      notes: values.notes || null,
    };
    try {
      if (toner) {
        await api.patch<Toner>(`/toners/${toner.id}`, payload);
      } else {
        await api.post<Toner>("/toners", payload);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{toner ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <FormField name="name" label={t("fields.name")} required>
            {({ id, ...props }) => (
              <Input id={id} {...props} value={props.value as string} />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="part_number" label={t("fields.partNumber")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>

            <FormField name="color" label={t("fields.color")}>
              {({ id, value, onChange }) => (
                <Select value={value as string} onValueChange={(v) => onChange(v)}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={t("fields.color")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(["black", "cyan", "magenta", "yellow"] as const).map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`colors.${c}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>

          <FormField name="printer_models" label={t("fields.printerModels")}>
            {({ id, ...props }) => (
              <Input id={id} {...props} value={props.value as string} placeholder="HL-L2350DW, HL-L2370DW" />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField name="current_stock" label={t("fields.currentStock")}>
              {({ id, ...props }) => (
                <Input id={id} type="number" min="0" {...props} value={props.value as number} />
              )}
            </FormField>

            <FormField name="low_stock_threshold" label={t("fields.lowStockThreshold")}>
              {({ id, ...props }) => (
                <Input id={id} type="number" min="0" {...props} value={props.value as number} />
              )}
            </FormField>

            <FormField name="unit" label={t("fields.unit")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="unit_cost" label={t("fields.unitCost")}>
              {({ id, ...props }) => (
                <Input id={id} type="number" step="0.01" min="0" {...props} value={props.value as number} />
              )}
            </FormField>

            <FormField name="supplier" label={t("fields.supplier")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <FormField name="supplier_part_number" label={t("fields.supplierPartNumber")}>
            {({ id, ...props }) => (
              <Input id={id} {...props} value={props.value as string} />
            )}
          </FormField>

          <FormField name="notes" label={t("fields.notes")}>
            {({ id, ...props }) => (
              <Textarea id={id} {...props} value={props.value as string} rows={3} />
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