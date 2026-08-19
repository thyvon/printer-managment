"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { Printer, Site } from "@/lib/types";
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
  site_id: z.number().min(1),
  name: z.string().min(2),
  manufacturer: z.string().optional().or(z.literal("")),
  model: z.string().optional().or(z.literal("")),
  serial_number: z.string().optional().or(z.literal("")),
  ip_address: z
    .string()
    .regex(/^(\d{1,3}\.){3}\d{1,3}$/)
    .optional()
    .or(z.literal("")),
  snmp_community: z.string().optional().or(z.literal("")),
  status: z.enum(["online", "offline", "maintenance"]),
});

type FormValues = z.infer<typeof schema>;

export function PrinterForm({
  open,
  onOpenChange,
  printer,
  sites,
  defaultSiteId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  printer?: Printer | null;
  sites: Site[];
  defaultSiteId?: number | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Printers");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      site_id: defaultSiteId ?? sites[0]?.id ?? 0,
      name: "",
      manufacturer: "",
      model: "",
      serial_number: "",
      ip_address: "",
      snmp_community: "",
      status: "online",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        site_id: printer?.site_id ?? defaultSiteId ?? sites[0]?.id ?? 0,
        name: printer?.name ?? "",
        manufacturer: printer?.manufacturer ?? "",
        model: printer?.model ?? "",
        serial_number: printer?.serial_number ?? "",
        ip_address: printer?.ip_address ?? "",
        snmp_community: printer?.snmp_community ?? "",
        status: printer?.status ?? "online",
      });
    }
  }, [open, printer, defaultSiteId, sites, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    const payload = {
      ...values,
      manufacturer: values.manufacturer || null,
      model: values.model || null,
      serial_number: values.serial_number || null,
      ip_address: values.ip_address || null,
      snmp_community: values.snmp_community || null,
    };
    try {
      if (printer) {
        await api.patch<Printer>(`/printers/${printer.id}`, payload);
      } else {
        await api.post<Printer>("/printers", payload);
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
          <DialogTitle>
            {printer ? t("editTitle") : t("createTitle")}
          </DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <FormField name="site_id" label={t("fields.site")} required>
            {({ id, value, onChange }) => (
              <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="name" label={t("fields.name")} required>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
            <FormField name="manufacturer" label={t("fields.manufacturer")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="model" label={t("fields.model")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
            <FormField name="serial_number" label={t("fields.serialNumber")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="ip_address" label={t("fields.ipAddress")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
            <FormField name="snmp_community" label={t("fields.snmpCommunity")}>
              {({ id, ...props }) => (
                <Input id={id} {...props} value={props.value as string} />
              )}
            </FormField>
          </div>

          <FormField name="status" label={t("fields.status")} required>
            {({ id, value, onChange }) => (
              <Select value={value as string} onValueChange={(v) => onChange(v)}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">{tCommon("status.online")}</SelectItem>
                  <SelectItem value="offline">{tCommon("status.offline")}</SelectItem>
                  <SelectItem value="maintenance">{tCommon("status.maintenance")}</SelectItem>
                </SelectContent>
              </Select>
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