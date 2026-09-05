"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { Customer } from "@/lib/types";
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
import { FormField } from "@/components/form-field";
import { FormCombobox } from "@/components/form-combobox";
import { ApiError } from "@/lib/api";
import { toast } from "sonner";
import { useEffect, useState } from "react";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  currency: z.enum(["USD", "KHR"]),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof schema>;

export function CustomerForm({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Customers");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      currency: "USD",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      methods.reset({
        name: customer?.name ?? "",
        email: customer?.email ?? "",
        phone: customer?.phone ?? "",
        address: customer?.address ?? "",
        currency: customer?.currency ?? "USD",
        status: customer?.status ?? "active",
      });
    }
  }, [open, customer, methods.reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const payload = {
      ...values,
      email: values.email || null,
      phone: values.phone || null,
      address: values.address || null,
    };
    try {
      if (customer) {
        await api.patch<Customer>(`/customers/${customer.id}`, payload);
      } else {
        await api.post<Customer>("/customers", payload);
      }
      toast.success(customer ? t("editTitle") : t("createTitle"));
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {customer ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField name="name" label={t("fields.name")} required>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="email" label={t("fields.email")}>
                {({ id, ...props }) => (
                  <Input id={id} type="email" {...props} value={props.value as string} />
                )}
              </FormField>
              <FormField name="phone" label={t("fields.phone")}>
                {({ id, ...props }) => (
                  <Input id={id} {...props} value={props.value as string} />
                )}
              </FormField>
            </div>

            <FormField name="address" label={t("fields.address")}>
              {({ id, ...props }) => (
                <Textarea id={id} {...props} value={props.value as string} />
              )}
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormCombobox
                name="currency"
                label={t("fields.currency")}
                required
                options={[
                  { label: "USD ($)", value: "USD" },
                  { label: "KHR (៛)", value: "KHR" },
                ]}
              />
              <FormCombobox
                name="status"
                label={t("fields.status")}
                required
                options={[
                  { label: tCommon("status.active"), value: "active" },
                  { label: tCommon("status.inactive"), value: "inactive" },
                ]}
              />
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