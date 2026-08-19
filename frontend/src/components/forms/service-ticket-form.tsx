"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
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
      reset({
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
  }, [open, ticket, defaultCustomerId, customers, reset]);

  const onSubmit = handleSubmit(async (values) => {
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ticket ? t("editTitle") : t("createTitle")}</DialogTitle>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="site_id" label={t("fields.site")}>
              {({ id, value, onChange }) => (
                <Select value={value} onValueChange={(v) => onChange(v)}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={t("fields.site")} />
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

            <FormField name="printer_id" label={t("fields.printer")}>
              {({ id, value, onChange }) => (
                <Select value={value} onValueChange={(v) => onChange(v)}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={t("fields.printer")} />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.map((printer) => (
                      <SelectItem key={printer.id} value={String(printer.id)}>
                        {printer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
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
            <FormField name="status" label={t("fields.status")}>
              {({ id, value, onChange }) => (
                <Select value={value} onValueChange={(v) => onChange(v)}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["open", "assigned", "in_progress", "resolved", "closed", "cancelled"] as const).map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`status.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField name="priority" label={t("fields.priority")}>
              {({ id, value, onChange }) => (
                <Select value={value} onValueChange={(v) => onChange(v)}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(["low", "medium", "high", "urgent"] as const).map((p) => (
                      <SelectItem key={p} value={p}>
                        {t(`priority.${p}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField name="assigned_user_id" label={t("fields.assignedUser")}>
              {({ id, value, onChange }) => (
                <Select value={value} onValueChange={(v) => onChange(v)}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue placeholder={t("fields.assignedUser")} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="scheduled_at" label={t("fields.scheduledAt")}>
              {({ id, ...props }) => (
                <Input id={id} type="datetime-local" {...props} value={props.value as string} />
              )}
            </FormField>

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}