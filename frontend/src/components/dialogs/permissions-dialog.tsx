"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTranslations } from "next-intl";
import type { User } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

type PermissionsPageProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
};

export function PermissionsDialog({
  open,
  onOpenChange,
  user,
}: PermissionsPageProps) {
  const t = useTranslations("Users.permissions");
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  const { data: allPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get<Record<string, string[]>>("/permissions"),
    enabled: open,
  });

  const handleOpenChange = (value: boolean) => {
    if (value && user) {
      setSelected(user.permissions ?? []);
    }
    onOpenChange(value);
  };

  const mutation = useMutation({
    mutationFn: (permissions: string[]) =>
      api.put(`/users/${user?.id}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
    },
  });

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const toggleGroup = (group: string, perms: string[]) => {
    const allSelected = perms.every((p) => selected.includes(p));
    setSelected((prev) => {
      if (allSelected) {
        return prev.filter((p) => !perms.includes(p));
      }
      return [...new Set([...prev, ...perms])];
    });
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { name: user.name })}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {allPermissions &&
              Object.entries(allPermissions).map(([group, perms]) => (
                <div key={group}>
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      checked={perms.every((p) => selected.includes(p))}
                      onCheckedChange={() => toggleGroup(group, perms)}
                    />
                    <span className="text-sm font-medium capitalize">
                      {group.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="ml-6 grid grid-cols-2 gap-1">
                    {perms.map((perm) => (
                      <label
                        key={perm}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={selected.includes(perm)}
                          onCheckedChange={() => toggle(perm)}
                        />
                        {perm.split(".")[1]}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => mutation.mutate(selected)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t("saving") : t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
