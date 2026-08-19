"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FieldLabel } from "@/components/form-field";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ApiError } from "@/lib/api";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const { login, status } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError(t("errors.generic"));
      }
    }
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 px-4">
      <div className="flex w-full max-w-md flex-col gap-2 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Building2 className="size-6" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <FieldLabel htmlFor="email" required>
              {t("email")}
            </FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div className="grid gap-1.5">
            <FieldLabel htmlFor="password" required>
              {t("password")}
            </FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={Boolean(errors.password)}
            />
            <FieldError message={errors.password?.message} />
          </div>

          {serverError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("loggingIn") : t("login")}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("signUp")}
          </Link>
        </p>
      </div>

      <LocaleSwitcher />
    </div>
  );
}