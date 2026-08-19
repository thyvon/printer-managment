"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LocaleSwitcher() {
  const t = useTranslations("Locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        router.replace(pathname, { locale: value as (typeof routing.locales)[number] });
      }}
    >
      <SelectTrigger className="w-fit" aria-label={t("switchTo")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((l) => (
          <SelectItem key={l} value={l}>
            {t(l)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}