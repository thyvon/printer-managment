"use client";

import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Paginated, AppNotification } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { PageLoading } from "@/components/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/pagination-controls";
import { useState } from "react";
import Link from "next/link";

const typeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  info: "secondary",
  warning: "destructive",
  success: "default",
  error: "destructive",
};

export default function NotificationsPage() {
  const t = useTranslations("Notifications");
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["notifications", page],
    queryFn: () => api.get<Paginated<AppNotification>>(`/notifications?page=${page}`),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch("/notifications/read-all", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  if (isLoading) return <PageLoading />;

  if (isError || !data) {
    return (
      <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
        {tCommon("errors.load")}
      </p>
    );
  }

  const unread = data.data.filter((n) => !n.read_at);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("title")} description={t("subtitle")} />
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            {t("markAllRead")}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {data.data.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="divide-y">
              {data.data.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-4 px-4 py-3 ${!n.read_at ? "bg-muted/30" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.data.title}</p>
                      <Badge variant={typeVariant[n.data.type] ?? "secondary"}>{n.data.type}</Badge>
                      {!n.read_at && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.data.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {n.data.url && (
                      <Link href={n.data.url} className="text-sm text-primary hover:underline">
                        {t("view")}
                      </Link>
                    )}
                    {!n.read_at && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate(n.id)}
                      >
                        {t("markRead")}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PaginationControls setPage={setPage} data={data} />
    </div>
  );
}
