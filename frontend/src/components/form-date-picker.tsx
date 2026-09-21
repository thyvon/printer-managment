"use client";

import { useState } from "react";
import { useController, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const { field, fieldState } = useController({ control, name });

  const dateValue = field.value ? new Date(field.value as string) : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateValue && "text-muted-foreground",
                fieldState.error && "border-destructive"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {dateValue ? format(dateValue, "PPP") : (placeholder ?? "Pick a date")}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={(day) => {
              field.onChange(day ? format(day, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {fieldState.error && (
        <p className="text-sm text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  );
}
