"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Customer, Paginated, Printer, Site, User } from "@/lib/types";

export function useCustomerOptions() {
  return useQuery({
    queryKey: ["customers", "options"],
    queryFn: () =>
      api.get<Paginated<Customer>>("/customers?per_page=100").then((r) => r.data),
  });
}

export function useSiteOptions() {
  return useQuery({
    queryKey: ["sites", "options"],
    queryFn: () =>
      api.get<Paginated<Site>>("/sites?per_page=100").then((r) => r.data),
  });
}

export function usePrinterOptions() {
  return useQuery({
    queryKey: ["printers", "options"],
    queryFn: () =>
      api.get<Paginated<Printer>>("/printers?per_page=100").then((r) => r.data),
  });
}

export function useUserOptions() {
  return useQuery({
    queryKey: ["users", "options"],
    queryFn: () =>
      api.get<Paginated<User>>("/users?per_page=100").then((r) => r.data),
  });
}