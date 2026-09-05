"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { Customer, Printer, ServiceTicket, Site, User } from "@/lib/types";
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
import { ApiError } from "@/lib/api";
import { toast } from "sonner";
import { FormField } from "@/components/form-field";
import { FormCombobox } from "@/components/form-combobox";
import { FormDatePicker } from "@/components/form-date-picker";
import { useEffect, useState } from "react";

const schema = z.object({
  customer_id: z.number().min(1),
  site_id: z.string().optional().or(z.literal("")),
  printer_id: z.string().optional().or(z.literal("")),
  title: z.string().min(3),
  description: z.string().optional().or(z.literal("")),
  status: z.enum(["open", "assigned", "in_progress", "resolved", "closed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigned_user_id: z.string().optional().or(z.literal("")),
  scheduled_at: z.string().optional().or(z.literal("")),
  parts_used: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function ServiceTicketForm({
  open,
  onOpenChange,
  ticket,
  customers,
  sites,
  printers,
  users,
  defaultCustomerId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: ServiceTicket | null;
  customers: Customer[];
  sites: Site[];
  printers: Printer[];
  users: User[];
  defaultCustomerId?: number | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Maintenance");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: defaultCustomerId ?? customers[0]?.id ?? 0,
      site_id: "",
      printer_id: "",
      title: "",
      description: "",
      status: "open",
      priority: "medium",
      assigned_user_id: "",
      scheduled_at: "",
      parts_used: "",
    },
  });

  useEffect(() => {
    if (open) {
      methods.reset({
        customer_id: ticket?.customer_id ?? defaultCustomerId ?? customers[0]?.id ?? 0,
        site_id: String(ticket?.site_id ?? ""),
        printer_id: String(ticket?.printer_id ?? ""),
        title: ticket?.title ?? "",
        description: ticket?.description ?? "",
        status: ticket?.status ?? "open",
        priority: ticket?.priority ?? "medium",
        assigned_user_id: String(ticket?.assigned_user_id ?? ""),
        scheduled_at: ticket?.scheduled_at ?? "",
        parts_used: ticket?.parts_used ?? "",
      });
    }
  }, [open, ticket, defaultCustomerId, customers, methods.reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const payload = {
      ...values,
      site_id: values.site_id ? Number(values.site_id) : null,
      printer_id: values.printer_id ? Number(values.printer_id) : null,
      assigned_user_id: values.assigned_user_id ? Number(values.assigned_user_id) : null,
      description: values.description || null,
      scheduled_at: values.scheduled_at || null,
      parts_used: values.parts_used || null,
    };
    try {
      if (ticket) {
        await api.patch<ServiceTicket>(`/service-tickets/${ticket.id}`, payload);
      } else {
        await api.post<ServiceTicket>("/service-tickets", payload);
      }
      toast.success(ticket ? t("editTitle") : t("createTitle"));
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket ? t("editTitle") : t("createTitle")}</DialogTitle>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormCombobox
              name="site_id"
              label={t("fields.site")}
              options={sites.map((s) => ({ label: s.name, value: String(s.id) }))}
              placeholder={t("fields.site")}
            />

            <FormCombobox
              name="printer_id"
              label={t("fields.printer")}
              options={printers.map((p) => ({ label: p.name, value: String(p.id) }))}
              placeholder={t("fields.printer")}
            />
          </div>

          <FormField name="title" label={t("fields.title")} required>
            {({ id, ...props }) => (
              <Input id={id} {...props} value={props.value as string} />
            )}
          </FormField>

          <FormField name="description" label={t("fields.description")}>
            {({ id, ...props }) => (
              <Textarea id={id} {...props} value={props.value as string} rows={3} />
            )}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormCombobox
              name="status"
              label={t("fields.status")}
              options={([
                { label: t("status.open"), value: "open" },
                { label: t("status.assigned"), value: "assigned" },
                { label: t("status.in_progress"), value: "in_progress" },
                { label: t("status.resolved"), value: "resolved" },
                { label: t("status.closed"), value: "closed" },
                { label: t("status.cancelled"), value: "cancelled" },
              ])}
            />

            <FormCombobox
              name="priority"
              label={t("fields.priority")}
              options={([
                { label: t("priority.low"), value: "low" },
                { label: t("priority.medium"), value: "medium" },
                { label: t("priority.high"), value: "high" },
                { label: t("priority.urgent"), value: "urgent" },
              ])}
            />

            <FormCombobox
              name="assigned_user_id"
              label={t("fields.assignedUser")}
              options={users.map((u) => ({ label: `${u.name} (${u.email})`, value: String(u.id) }))}
              placeholder={t("fields.assignedUser")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormDatePicker
                control={methods.control}
                name="scheduled_at"
                label={t("fields.scheduledAt")}
              />

            <FormField name="parts_used" label={t("fields.partsUsed")}>
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