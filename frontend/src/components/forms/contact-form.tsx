"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
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
      reset({
        customer_id: contact?.customer_id ?? defaultCustomerId ?? customers[0]?.id ?? 0,
        site_id: String(contact?.site_id ?? ""),
        name: contact?.name ?? "",
        email: contact?.email ?? "",
        phone: contact?.phone ?? "",
        role: contact?.role ?? "",
      });
    }
  }, [open, contact, defaultCustomerId, customers, reset]);

  const onSubmit = handleSubmit(async (values) => {
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
          <DialogTitle>{contact ? t("editTitle") : t("createTitle")}</DialogTitle>
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

          <FormField name="site_id" label={t("fields.site")}>
            {({ id, value, onChange }) => (
              <Select value={String(value)} onValueChange={(v) => onChange(v)}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sites.map((site) => (
                    <SelectItem key={site.id} value={String(site.id)}>
                      {site.name}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}