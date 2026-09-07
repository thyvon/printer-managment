"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/form-field";
import { useForm, FormProvider, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1),
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
});

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const tCommon = useTranslations("Common");
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-6 md:grid-cols-2">
        <ProfileCard user={user} t={t} tCommon={tCommon} />
        <PasswordCard t={t} tCommon={tCommon} />
      </div>
    </div>
  );
}

function ProfileCard({
  user,
  t,
  tCommon,
}: {
  user: { id: number; name: string; email: string } | null;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema) as Resolver<ProfileValues>,
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    setServerError(null);
    try {
      await api.patch("/user", values);
      toast.success(t("saved"));
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError(tCommon("errors.generic"));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile")}</CardTitle>
        <CardDescription>{t("profileDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
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

            {serverError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <Button type="submit" disabled={methods.formState.isSubmitting}>
              {methods.formState.isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

function PasswordCard({
  t,
  tCommon,
}: {
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const methods = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema) as Resolver<PasswordValues>,
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (values: PasswordValues) => {
    setServerError(null);
    try {
      await api.patch("/user", values);
      toast.success(t("passwordChanged"));
      methods.reset();
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError(tCommon("errors.generic"));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("password")}</CardTitle>
        <CardDescription>{t("passwordDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField name="current_password" label={t("fields.currentPassword")} required>
              {({ id, ...props }) => (
                <Input id={id} type="password" {...props} value={props.value as string} />
              )}
            </FormField>

            <FormField name="password" label={t("fields.newPassword")} required>
              {({ id, ...props }) => (
                <Input id={id} type="password" {...props} value={props.value as string} />
              )}
            </FormField>

            <FormField name="password_confirmation" label={t("fields.confirmPassword")} required>
              {({ id, ...props }) => (
                <Input id={id} type="password" {...props} value={props.value as string} />
              )}
            </FormField>

            {serverError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <Button type="submit" disabled={methods.formState.isSubmitting}>
              {methods.formState.isSubmitting ? tCommon("saving") : tCommon("save")}
            </Button>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
