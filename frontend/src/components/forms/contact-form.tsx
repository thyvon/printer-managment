"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { Contact, Customer, Site } from "@/lib/types";
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
import { useEffect, useState } from "react";

const schema = z.object({
  customer_id: z.number().min(1),
  site_id: z.string().optional().or(z.literal("")),
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  role: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm({
  open,
  onOpenChange,
  contact,
  customers,
  sites,
  defaultCustomerId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null;
  customers: Customer[];
  sites: Site[];
  defaultCustomerId?: number | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Contacts");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: defaultCustomerId ?? customers[0]?.id ?? 0,
      site_id: "",
      name: "",
      email: "",
      phone: "",
      role: "",
    },
  });

  useEffect(() => {
    if (open) {
      methods.reset({
        customer_id: contact?.customer_id ?? defaultCustomerId ?? customers[0]?.id ?? 0,
        site_id: String(contact?.site_id ?? ""),
        name: contact?.name ?? "",
        email: contact?.email ?? "",
        phone: contact?.phone ?? "",
        role: contact?.role ?? "",
      });
    }
  }, [open, contact, defaultCustomerId, customers, methods.reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const payload = {
      ...values,
      site_id: values.site_id ? Number(values.site_id) : null,
      email: values.email || null,
      phone: values.phone || null,
      role: values.role || null,
    };
    try {
      if (contact) {
        await api.patch<Contact>(`/contacts/${contact.id}`, payload);
      } else {
        await api.post<Contact>("/contacts", payload);
      }
      toast.success(contact ? t("editTitle") : t("createTitle"));
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
          <DialogTitle>{contact ? t("editTitle") : t("createTitle")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-4">
          <FormCombobox
              name="customer_id"
              label={t("fields.customer")}
              required
              options={customers.map((c) => ({ label: c.name, value: String(c.id) }))}
              placeholder={t("fields.customer")}
            />

            <FormCombobox
              name="site_id"
              label={t("fields.site")}
              options={sites.map((s) => ({ label: s.name, value: String(s.id) }))}
              placeholder={t("fields.site")}
            />

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

          <FormField name="role" label={t("fields.role")}>
            {({ id, ...props }) => (
              <Input id={id} {...props} value={props.value as string} />
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