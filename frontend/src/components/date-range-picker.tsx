"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  range: DateRange | undefined;
  onChange: (r: DateRange | undefined) => void;
  label: string;
}

export function DateRangePicker({
  range,
  onChange,
  label,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [localRange, setLocalRange] = useState<DateRange | undefined>(undefined);

  const from = localRange?.from ?? range?.from;
  const to = localRange?.to ?? range?.to;

  const display = from
    ? to
      ? `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`
      : format(from, "MMM d, yyyy")
    : label;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          if (localRange?.from && localRange?.to) {
            onChange(localRange);
          } else {
            setLocalRange(undefined);
          }
        }
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !from && "text-muted-foreground"
            )}
          />
        }
      >
        <CalendarIcon className="mr-2 size-4" />
        {display}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={from}
          selected={localRange}
          onSelect={(r) => {
            if (!r?.from) {
              setLocalRange(undefined);
              return;
            }
            setLocalRange({ from: r.from, to: r.to });
            if (r.from && r.to && r.from.getTime() !== r.to.getTime()) {
              onChange({ from: r.from, to: r.to });
              requestAnimationFrame(() => setOpen(false));
            }
          }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
