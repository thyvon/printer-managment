"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { Collector, Site } from "@/lib/types";
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
import { toast } from "sonner";
import { useEffect, useState } from "react";

const schema = z.object({
  site_id: z.number().min(1),
  name: z.string().min(2),
  status: z.enum(["active", "inactive", "unreachable"]),
});

type FormValues = z.infer<typeof schema>;

type CreatedCollector = Collector & { token: string };

export function CollectorForm({
  open,
  onOpenChange,
  collector,
  sites,
  defaultSiteId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collector?: Collector | null;
  sites: Site[];
  defaultSiteId?: number | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Collectors");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      site_id: defaultSiteId ?? sites[0]?.id ?? 0,
      name: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        site_id: collector?.site_id ?? defaultSiteId ?? sites[0]?.id ?? 0,
        name: collector?.name ?? "",
        status: (collector?.status as FormValues["status"]) ?? "active",
      });
    }
  }, [open, collector, defaultSiteId, sites, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      if (collector) {
        await api.patch<Collector>(`/collectors/${collector.id}`, values);
        onOpenChange(false);
        onSuccess?.();
      } else {
        const created = await api.post<CreatedCollector>("/collectors", values);
        setCreatedToken(created.token);
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError(tCommon("errors.generic"));
      }
    }
  });

  const copyToken = async () => {
    if (!createdToken) return;
    await navigator.clipboard.writeText(createdToken);
    toast.success(t("tokenCopied"));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {collector ? t("editTitle") : t("createTitle")}
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
              <FormField name="status" label={t("fields.status")}>
                {({ id, value, onChange }) => (
                  <Select value={value as string} onValueChange={(v) => onChange(v)}>
                    <SelectTrigger id={id} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["active", "inactive", "unreachable"] as const).map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      <Dialog open={Boolean(createdToken)} onOpenChange={(open) => !open && setCreatedToken(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("tokenTitle")}</DialogTitle>
            <DialogDescription>{t("tokenDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <code className="break-all text-xs">{createdToken}</code>
            </div>
            <div className="flex justify-end">
              <Button onClick={copyToken}>
                {t("copyToken")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}