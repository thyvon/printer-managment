"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { Customer, Site } from "@/lib/types";
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
import { useEffect, useState } from "react";

const schema = z.object({
  customer_id: z.number().min(1),
  name: z.string().min(2),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function SiteForm({
  open,
  onOpenChange,
  site,
  customers,
  defaultCustomerId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site?: Site | null;
  customers: Customer[];
  defaultCustomerId?: number | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Sites");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: defaultCustomerId ?? customers[0]?.id ?? 0,
      name: "",
      address: "",
      city: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        customer_id: site?.customer_id ?? defaultCustomerId ?? customers[0]?.id ?? 0,
        name: site?.name ?? "",
        address: site?.address ?? "",
        city: site?.city ?? "",
        phone: site?.phone ?? "",
      });
    }
  }, [open, site, defaultCustomerId, customers, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const payload = {
      ...values,
      address: values.address || null,
      city: values.city || null,
      phone: values.phone || null,
    };
    try {
      if (site) {
        await api.patch<Site>(`/sites/${site.id}`, payload);
      } else {
        await api.post<Site>("/sites", payload);
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
          <DialogTitle>{site ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
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

          <FormField name="address" label={t("fields.address")}>
            {({ id, ...props }) => (
              <Input id={id} {...props} value={props.value as string} />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="city" label={t("fields.city")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
            <FormField name="phone" label={t("fields.phone")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
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