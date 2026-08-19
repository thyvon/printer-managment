"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  useController,
  type FieldValues,
  type Path,
} from "react-hook-form";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

export function FieldLabel({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <Label
      htmlFor={htmlFor}
      className={cn(
        required &&
          "after:ml-0.5 after:content-['*'] after:text-destructive"
      )}
    >
      {children}
    </Label>
  );
}

export function FormField<T extends FieldValues>({
  name,
  label,
  required,
  hint,
  children,
}: {
  name: Path<T>;
  label: string;
  required?: boolean;
  hint?: string;
  children: (props: {
    id: string;
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    invalid: boolean;
  }) => ReactNode;
}) {
  const { field, fieldState } = useController<T>({ name });
  const error = fieldState.error?.message as string | undefined;
  const id = `field-${String(name)}`;

  return (
    <div className="grid gap-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {children({
        id,
        value: field.value,
        onChange: field.onChange,
        onBlur: () => field.onBlur(),
        invalid: fieldState.invalid,
      })}
      {hint && !error ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <FieldError message={error} />
    </div>
  );
}