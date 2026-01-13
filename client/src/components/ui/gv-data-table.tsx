import { ReactNode, useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface GVColumn<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
}

interface GVDataTableProps<T> {
  columns: GVColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  rowKey: (item: T) => string;
  onRowClick?: (item: T) => void;
  onExport?: () => void;
  exportLabel?: string;
  className?: string;
  compact?: boolean;
  striped?: boolean;
}

export function GVDataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No hay datos disponibles",
  emptyIcon,
  rowKey,
  onRowClick,
  onExport,
  exportLabel = "Exportar",
  className,
  compact = false,
  striped = true,
}: GVDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = String((a as Record<string, unknown>)[sortKey] ?? "");
        const bVal = String((b as Record<string, unknown>)[sortKey] ?? "");
        if (aVal === bVal) return 0;
        const cmp = aVal < bVal ? -1 : 1;
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border bg-card", className)}>
        {onExport && (
          <div className="flex justify-end p-3 border-b bg-muted/30">
            <Skeleton className="h-9 w-24" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("font-semibold text-xs uppercase tracking-wide", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={compact ? "py-2" : "py-3"}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("rounded-lg border bg-card", className)}>
        {onExport && (
          <div className="flex justify-end p-3 border-b bg-muted/30">
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              {exportLabel}
            </Button>
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("font-semibold text-xs uppercase tracking-wide", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-40">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  {emptyIcon && <div className="mb-3 opacity-50">{emptyIcon}</div>}
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      {onExport && (
        <div className="flex justify-end p-3 border-b bg-muted/30">
          <Button variant="outline" size="sm" onClick={onExport} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            {exportLabel}
          </Button>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "font-semibold text-xs uppercase tracking-wide",
                    col.sortable && "cursor-pointer select-none",
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="ml-1">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3 opacity-40" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item, index) => (
              <TableRow
                key={rowKey(item)}
                className={cn(
                  onRowClick && "cursor-pointer",
                  striped && index % 2 === 1 && "bg-muted/20",
                  "hover:bg-muted/40 transition-colors"
                )}
                onClick={() => onRowClick?.(item)}
                data-testid={`row-${rowKey(item)}`}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn(compact ? "py-2" : "py-3", col.className)}>
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
