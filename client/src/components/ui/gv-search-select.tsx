import { useState, useMemo } from "react";
import { Search, ChevronDown, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GVSearchSelectProps<T> {
  items: T[];
  value: string;
  onChange: (value: string) => void;
  getItemValue: (item: T) => string;
  getItemLabel: (item: T) => string;
  getItemSubLabel?: (item: T) => string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  testId?: string;
}

export function GVSearchSelect<T>({
  items,
  value,
  onChange,
  getItemValue,
  getItemLabel,
  getItemSubLabel,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  isLoading = false,
  disabled = false,
  className,
  testId = "search-select",
}: GVSearchSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const query = search.toLowerCase();
    return items.filter((item) => {
      const label = getItemLabel(item).toLowerCase();
      const subLabel = getItemSubLabel?.(item)?.toLowerCase() || "";
      return label.includes(query) || subLabel.includes(query);
    });
  }, [items, search, getItemLabel, getItemSubLabel]);

  const selectedItem = items.find((item) => getItemValue(item) === value);

  const handleSelect = (itemValue: string) => {
    onChange(itemValue);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            className
          )}
          data-testid={`button-${testId}`}
        >
          <span className="truncate">
            {isLoading
              ? "Cargando..."
              : selectedItem
              ? getItemLabel(selectedItem)
              : placeholder}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {value && !disabled && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              data-testid={`input-search-${testId}`}
            />
          </div>
        </div>
        <ScrollArea className="max-h-[300px]">
          {filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            <div className="p-1">
              {filteredItems.map((item) => {
                const itemValue = getItemValue(item);
                const isSelected = itemValue === value;
                return (
                  <button
                    key={itemValue}
                    onClick={() => handleSelect(itemValue)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-2 text-left text-sm rounded-md",
                      "hover:bg-muted transition-colors",
                      isSelected && "bg-muted"
                    )}
                    data-testid={`option-${testId}-${itemValue}`}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getItemLabel(item)}</div>
                      {getItemSubLabel && (
                        <div className="text-xs text-muted-foreground truncate">
                          {getItemSubLabel(item)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
