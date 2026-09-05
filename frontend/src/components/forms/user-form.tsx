"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { z } from "zod";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
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
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional().or(z.literal("")),
  password_confirmation: z.string().optional().or(z.literal("")),
  role: z.enum(["admin", "manager", "staff"]),
});

type FormValues = z.infer<typeof schema>;

export function UserForm({
  open,
  onOpenChange,
  user,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSuccess?: () => void;
}) {
  const t = useTranslations("Users");
  const tCommon = useTranslations("Common");
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      role: "staff",
    },
  });

  useEffect(() => {
    if (open) {
      methods.reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        password: "",
        password_confirmation: "",
        role: (user?.role ?? "staff") as "admin" | "manager" | "staff",
      });
    }
  }, [open, user, methods.reset]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      if (user) {
        const payload: Record<string, unknown> = {
          name: values.name,
          email: values.email,
          role: values.role,
        };
        if (values.password) {
          payload.password = values.password;
          payload.password_confirmation = values.password_confirmation;
        }
        await api.patch<User>(`/users/${user.id}`, payload);
      } else {
        await api.post<User>("/users", values);
      }
      toast.success(user ? t("editTitle") : t("createTitle"));
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {user ? t("editTitle") : t("createTitle")}
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

            <FormField name="email" label={t("fields.email")} required>
              {({ id, ...props }) => (
                <Input id={id} type="email" {...props} value={props.value as string} />
              )}
            </FormField>

            <FormField name="password" label={user ? t("fields.newPassword") : t("fields.password")} required={!user}>
              {({ id, ...props }) => (
                <Input id={id} type="password" {...props} value={props.value as string} />
              )}
            </FormField>

            {methods.watch("password") && (
              <FormField name="password_confirmation" label={t("fields.passwordConfirmation")} required>
                {({ id, ...props }) => (
                  <Input id={id} type="password" {...props} value={props.value as string} />
                )}
              </FormField>
            )}

            <FormCombobox
              name="role"
              label={t("fields.role")}
              required
              options={[
                { label: t("roles.admin"), value: "admin" },
                { label: t("roles.manager"), value: "manager" },
                { label: t("roles.staff"), value: "staff" },
              ]}
            />

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
