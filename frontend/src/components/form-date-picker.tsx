"use client";

import { useRef, useState, useEffect } from "react";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface FormDatePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
}

export function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  required,
  placeholder,
  disabled,
}: FormDatePickerProps<T>) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { field, fieldState } = useController({ control, name });

  const dateValue = field.value ? new Date(field.value as string) : undefined;

  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-datepicker-popup]") && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !dateValue && "text-muted-foreground",
          fieldState.error && "border-destructive"
        )}
      >
        <CalendarIcon className="mr-2 size-4" />
        {dateValue ? format(dateValue, "PPP") : (placeholder ?? "Pick a date")}
      </Button>
      {open &&
        createPortal(
          <div
            data-datepicker-popup
            className="z-[100] rounded-lg border bg-popover p-0 shadow-md"
            style={{ position: "absolute", top: pos.top, left: pos.left }}
          >
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(day) => {
                field.onChange(day ? format(day, "yyyy-MM-dd") : "");
                setOpen(false);
              }}
            />
          </div>,
          document.body
        )}
      {fieldState.error && (
        <p className="text-sm text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  );
}
