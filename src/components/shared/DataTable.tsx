import { ReactNode, useMemo, useState } from "react";
import { Search, Filter, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export { TableSkeleton } from "./TableSkeleton";
export { GlitCardSkeleton, GlitSkeletonGrid } from "./GlitCardSkeleton";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-border mb-6">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 w-full sm:w-[240px]"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  showAll?: boolean; // Optionally hide "All" option
  allLabel?: string; // Custom label for "All" option (default: "All")
}

export function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  showAll = true,
  allLabel = "All",
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-[150px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value="all">{allLabel}</SelectItem>}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface FilterSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  allLabel?: string;
  searchPlaceholder?: string;
  defaultVisibleCount?: number;
  className?: string;
  onSearchChange?: (query: string) => void;
  selectedLabel?: string;
  isLoading?: boolean;
}

export function FilterSearchSelect({
  value,
  onChange,
  placeholder,
  options,
  allLabel = "All",
  searchPlaceholder = "Search...",
  defaultVisibleCount = 5,
  className,
  onSearchChange,
  selectedLabel,
  isLoading = false,
}: FilterSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const resolvedSelectedLabel =
    value === "all"
      ? allLabel
      : selectedLabel ??
        options.find((option) => option.value === value)?.label ??
        placeholder;

  const visibleOptions = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    const isSearching = Boolean(term);

    if (onSearchChange) {
      if (!isSearching) {
        const initial = options.slice(0, defaultVisibleCount);
        if (value === "all") return initial;

        const selected = options.find((option) => option.value === value);
        if (!selected || initial.some((option) => option.value === value)) {
          return initial;
        }

        return [selected, ...initial.slice(0, defaultVisibleCount - 1)];
      }

      return options;
    }

    if (isSearching) {
      return options.filter((option) => option.label.toLowerCase().includes(term));
    }

    const initial = options.slice(0, defaultVisibleCount);
    if (value === "all") return initial;

    const selected = options.find((option) => option.value === value);
    if (!selected || initial.some((option) => option.value === value)) {
      return initial;
    }

    return [selected, ...initial.slice(0, defaultVisibleCount - 1)];
  }, [options, searchQuery, value, defaultVisibleCount, onSearchChange]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
      onSearchChange?.("");
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full sm:w-[180px] justify-between font-normal", className)}
        >
          <span className="truncate">{value === "all" ? placeholder : resolvedSelectedLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading stores…</p>
            ) : (
              <>
                {visibleOptions.length === 0 && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}
                <CommandGroup>
                  <CommandItem
                    value="__all__"
                    onSelect={() => {
                      onChange("all");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === "all" ? "opacity-100" : "opacity-0")}
                    />
                    {allLabel}
                  </CommandItem>
                  {visibleOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {!searchQuery.trim() && options.length >= defaultVisibleCount && (
                  <p className="px-3 py-2 text-xs text-muted-foreground border-t border-border">
                    Type to search for more stores
                  </p>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface FilterMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
}

export function FilterMultiSelect({
  values,
  onChange,
  placeholder,
  options,
  className,
}: FilterMultiSelectProps) {
  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    onChange([...values, value]);
  };

  const triggerLabel =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? options.find((option) => option.value === values[0])?.label ?? values[0]
        : `${values.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full sm:w-[150px] justify-between font-normal ${className ?? ""}`}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted cursor-pointer text-sm"
            >
              <Checkbox
                checked={values.includes(option.value)}
                onCheckedChange={() => toggle(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {values.length > 0 && (
          <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => onChange([])}>
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "outline";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/_/g, " ");
  
  const getStatusClass = () => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
      case "active":
      case "confirmed":
      case "available":
      case "trialing":
      case "resolved":
      case "accepted":
      case "published":
      case "sent":
        return "approved";
      case "pending":
      case "pending_setup":
      case "pending_approval":
      case "sending":
      case "in_progress":
      case "busy":
      case "processing":
      case "past_due":
      case "incomplete":
        return "pending";
      case "reviewing":
        return "reviewing";
      case "refunded":
        return "refunded";
      case "rejected":
      case "failed":
      case "cancelled":
      case "canceled":
      case "inactive":
      case "unavailable":
      case "offline":
      case "incomplete_expired":
      case "unpaid":
      case "dismissed":
      case "expired":
      case "revoked":
        return "rejected";
      default:
        return "";
    }
  };

  return (
    <span className={`status-badge ${getStatusClass()}`}>
      {normalizedStatus}
    </span>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 p-3 rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}
