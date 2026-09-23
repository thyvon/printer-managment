"use client";

import { useAuth } from "./auth-context";

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    if (user.role === "admin") return true;
    return permissions.some((p) => user.permissions?.includes(p) ?? false);
  };

  return { hasPermission, hasAnyPermission };
}
