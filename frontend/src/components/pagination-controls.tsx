"use client";

import { useTranslations } from "next-intl";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Paginated } from "@/lib/types";

export function PaginationControls<T>({
  setPage,
  data,
}: {
  setPage: (page: number) => void;
  data: Paginated<T>;
}) {
  const t = useTranslations("Common");
  const { current_page: current, last_page: last, total } = data.meta;

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {t("showing", {
          from: data.meta.from ?? 0,
          to: data.meta.to ?? 0,
          total,
        })}
      </p>
      <Pagination className="w-auto justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (current > 1) setPage(current - 1);
              }}
              text={t("previous")}
              className={current <= 1 ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
          {Array.from({ length: last }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === last || Math.abs(p - current) <= 1)
            .map((p, i, arr) => (
              <PaginationItem key={p}>
                {i > 0 && arr[i - 1] !== p - 1 ? (
                  <span className="px-1 text-muted-foreground">…</span>
                ) : null}
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                  isActive={p === current}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (current < last) setPage(current + 1);
              }}
              text={t("next")}
              className={current >= last ? "pointer-events-none opacity-50" : ""}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}