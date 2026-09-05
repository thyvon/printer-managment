"use client";

import { useTranslations } from "next-intl";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useController, type FieldValues, type Path } from "react-hook-form";
import { FieldLabel, FieldError } from "@/components/form-field";

type ComboboxOption = {
  label: string;
  value: string;
};

export function FormCombobox<T extends FieldValues>({
  name,
  label,
  required,
  options,
  placeholder,
  disabled,
}: {
  name: Path<T>;
  label: string;
  required?: boolean;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
}) {
  const { field, fieldState } = useController<T>({ name });
  const id = `field-${String(name)}`;
  const rawValue = String(field.value ?? "");
  const selectedItem = options.find((o) => o.value === rawValue) ?? null;
  const tCommon = useTranslations("Common");

  return (
    <div className="grid gap-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      <Combobox
        items={options as unknown as ComboboxOption[]}
        value={selectedItem}
        onValueChange={(val) => {
          const match = options.find((o) => o.value === String(val));
          if (match) {
            const numVal = Number(match.value);
            field.onChange(Number.isNaN(numVal) ? match.value : numVal);
          }
        }}
        isItemEqualToValue={(a, b) => {
          const itemA = a as unknown as ComboboxOption;
          const itemB = b as unknown as ComboboxOption;
          return itemA?.value === itemB?.value;
        }}
        disabled={disabled}
      >
        <ComboboxInput placeholder={placeholder ?? `Select ${label}`} />
        <ComboboxContent>
          <ComboboxEmpty>{tCommon("noResults")}</ComboboxEmpty>
          <ComboboxList>
            {(item: ComboboxOption) => (
              <ComboboxItem key={item.value} value={item.value}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {fieldState.error?.message ? (
        <FieldError message={fieldState.error.message as string} />
      ) : null}
    </div>
  );
}
