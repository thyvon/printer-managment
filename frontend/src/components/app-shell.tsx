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
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  MapPin,
  Printer,
  Receipt,
  Users,
} from "lucide-react";
import { useEffect } from "react";

const navItems = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/customers", key: "customers", icon: Users },
  { href: "/sites", key: "sites", icon: MapPin },
  { href: "/printers", key: "printers", icon: Printer },
  { href: "/contracts", key: "contracts", icon: FileText },
  { href: "/invoices", key: "invoices", icon: Receipt },
  { href: "/usages", key: "usages", icon: Gauge },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("App");
  const { status, company, user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoading />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-background md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Building2 className="size-5" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{company?.name ?? "MPS"}</p>
            <p className="truncate text-xs text-muted-foreground">
              {company?.plan}
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="text-muted-foreground"
            >
              <LogOut className="size-4" />
              {t("logout")}
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur md:hidden">
          <p className="truncate text-sm font-medium">{company?.name ?? "MPS"}</p>
          <LocaleSwitcher />
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b bg-background px-3 py-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
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
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}