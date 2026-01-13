import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface GVDateRangePickerProps {
  from: Date;
  to: Date;
  onFromChange: (date: Date) => void;
  onToChange: (date: Date) => void;
  className?: string;
  showQuickRanges?: boolean;
}

export function GVDateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  className,
  showQuickRanges = true,
}: GVDateRangePickerProps) {
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  const handleFromSelect = (date: Date | undefined) => {
    if (date) {
      if (date > to) {
        onToChange(date);
        onFromChange(to);
      } else {
        onFromChange(date);
      }
      setFromOpen(false);
    }
  };

  const handleToSelect = (date: Date | undefined) => {
    if (date) {
      if (date < from) {
        onFromChange(date);
        onToChange(from);
      } else {
        onToChange(date);
      }
      setToOpen(false);
    }
  };

  const setQuickRange = (range: "week" | "month" | "last7" | "last30") => {
    const today = new Date();
    switch (range) {
      case "week":
        onFromChange(startOfWeek(today, { weekStartsOn: 1 }));
        onToChange(endOfWeek(today, { weekStartsOn: 1 }));
        break;
      case "month":
        onFromChange(startOfMonth(today));
        onToChange(endOfMonth(today));
        break;
      case "last7":
        onFromChange(subDays(today, 6));
        onToChange(today);
        break;
      case "last30":
        onFromChange(subDays(today, 29));
        onToChange(today);
        break;
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Popover open={fromOpen} onOpenChange={setFromOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[140px] justify-start text-left font-normal"
              data-testid="button-date-from"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(from, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={from}
              onSelect={handleFromSelect}
              locale={es}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">a</span>

        <Popover open={toOpen} onOpenChange={setToOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-[140px] justify-start text-left font-normal"
              data-testid="button-date-to"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(to, "dd/MM/yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={to}
              onSelect={handleToSelect}
              locale={es}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {showQuickRanges && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickRange("week")}
            data-testid="button-quick-week"
            className="h-7 text-xs"
          >
            Esta semana
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickRange("month")}
            data-testid="button-quick-month"
            className="h-7 text-xs"
          >
            Este mes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickRange("last7")}
            data-testid="button-quick-last7"
            className="h-7 text-xs"
          >
            Ultimos 7 dias
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickRange("last30")}
            data-testid="button-quick-last30"
            className="h-7 text-xs"
          >
            Ultimos 30 dias
          </Button>
        </div>
      )}
    </div>
  );
}
