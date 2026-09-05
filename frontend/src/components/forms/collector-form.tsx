"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
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
import { FormField } from "@/components/form-field";
import { FormCombobox } from "@/components/form-combobox";
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

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      site_id: defaultSiteId ?? sites[0]?.id ?? 0,
      name: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      methods.reset({
        site_id: collector?.site_id ?? defaultSiteId ?? sites[0]?.id ?? 0,
        name: collector?.name ?? "",
        status: (collector?.status as FormValues["status"]) ?? "active",
      });
    }
  }, [open, collector, defaultSiteId, sites, methods.reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      if (collector) {
        await api.patch<Collector>(`/collectors/${collector.id}`, values);
        toast.success(t("editTitle"));
        onOpenChange(false);
        onSuccess?.();
      } else {
        const created = await api.post<CreatedCollector>("/collectors", values);
        setCreatedToken(created.token);
        toast.success(t("createTitle"));
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
  };

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
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-4">
            <FormCombobox
                name="site_id"
                label={t("fields.site")}
                required
                options={sites.map((s) => ({ label: s.name, value: String(s.id) }))}
                placeholder={t("fields.site")}
              />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField name="name" label={t("fields.name")} required>
                {({ id, ...props }) => (
                  <Input id={id} {...props} value={props.value as string} />
                )}
              </FormField>
              <FormCombobox
                  name="status"
                  label={t("fields.status")}
                  options={([
                    { label: t("status.active"), value: "active" },
                    { label: t("status.inactive"), value: "inactive" },
                    { label: t("status.unreachable"), value: "unreachable" },
                  ])}
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