"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth-context";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { PageLoading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Users,
  BarChart3,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/platform", key: "platformDashboard", icon: LayoutDashboard },
  { href: "/platform/tenants", key: "tenants", icon: Users },
  { href: "/platform/analytics", key: "analytics", icon: BarChart3 },
] as const;

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Platform");
  const { status, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
    if (status === "authenticated" && !user?.is_platform_admin) {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (!mounted || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  if (status === "unauthenticated" || !user?.is_platform_admin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Building2 className="size-5" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{t("title")}</p>
            <p className="truncate text-xs text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/platform" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-3 border-t p-3">
          <div className="px-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <LocaleSwitcher />
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="size-4" />
                {t("backToApp")}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="text-muted-foreground"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <p className="truncate text-sm font-medium">{t("title")}</p>
          <LocaleSwitcher />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-background px-3 py-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-3.5" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
