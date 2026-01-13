import { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  children: ReactNode;
  activeFilters?: { key: string; label: string; value: string }[];
  onClearFilter?: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function FilterBar({
  children,
  activeFilters = [],
  onClearFilter,
  onClearAll,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1 pr-1"
              data-testid={`filter-chip-${filter.key}`}
            >
              <span className="text-xs font-normal text-muted-foreground">
                {filter.label}:
              </span>
              <span className="text-xs">{filter.value}</span>
              {onClearFilter && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 no-default-hover-elevate"
                  onClick={() => onClearFilter(filter.key)}
                  data-testid={`button-remove-filter-${filter.key}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Badge>
          ))}
          {onClearAll && activeFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-xs h-7"
              data-testid="button-clear-all-filters"
            >
              Limpiar todos
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
