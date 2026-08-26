import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Check, X, Eye, Briefcase, Clock } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  FilterSearchSelect,
  FilterMultiSelect,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAdminServices, type GetAdminServicesParams } from "@/services/servicesApi";
import { getAdminStores } from "@/services/storesApi";
import { getMarketplaceCategories } from "@/services/marketplaceCategoriesApi";
import type { Service, ServiceType } from "@/types/api";
import { normalizePaginationMeta } from "@/lib/paginationUtils";
import { useToast } from "@/hooks/use-toast";

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

const SERVICE_TYPE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "home", label: "Home" },
  { value: "pickDrop", label: "Pick & Drop" },
];

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120, 150, 180, 240].map((minutes) => ({
  value: String(minutes),
  label: formatDuration(minutes),
}));

function formatServiceTypes(types?: ServiceType[]) {
  if (!types?.length) return "—";
  return types
    .map((type) => SERVICE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type)
    .join(", ");
}

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [selectedStoreLabel, setSelectedStoreLabel] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [debouncedStoreSearch, setDebouncedStoreSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [durationFilters, setDurationFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const limit = 20;
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStoreSearch(storeSearch), 300);
    return () => clearTimeout(timer);
  }, [storeSearch]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, storeFilter, categoryFilter, subcategoryFilter, typeFilters, durationFilters]);

  useEffect(() => {
    setSubcategoryFilter("all");
  }, [categoryFilter]);

  const { data: storesResponse, isFetching: isStoresLoading } = useQuery({
    queryKey: ["admin-stores-filter-options", debouncedStoreSearch],
    queryFn: () =>
      getAdminStores({
        page: 1,
        limit: debouncedStoreSearch.trim() ? 100 : 5,
      }),
    staleTime: 60 * 1000,
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ["marketplace-service-categories"],
    queryFn: () => getMarketplaceCategories({ type: "service", page: 1, limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const storeOptions = useMemo(() => {
    const term = debouncedStoreSearch.trim().toLowerCase();

    return (storesResponse?.data?.stores || [])
      .map((store) => ({
        value: store.id || (store as { _id?: string })._id || "",
        label: store.name,
      }))
      .filter((store) => store.value)
      .filter((store) => !term || store.label.toLowerCase().includes(term))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [storesResponse?.data?.stores, debouncedStoreSearch]);

  const handleStoreFilterChange = (value: string) => {
    setStoreFilter(value);
    if (value === "all") {
      setSelectedStoreLabel(null);
      return;
    }
    const match = storeOptions.find((store) => store.value === value);
    if (match) setSelectedStoreLabel(match.label);
  };

  const categoryOptions = useMemo(() => {
    return (categoriesResponse?.data?.categories || [])
      .map((category) => ({
        value: category.name,
        label: category.name,
        subcategories: category.subcategories ?? [],
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categoriesResponse?.data?.categories]);

  const subcategoryOptions = useMemo(() => {
    if (categoryFilter === "all") return [];
    const selected = categoryOptions.find((category) => category.value === categoryFilter);
    return (selected?.subcategories ?? [])
      .map((subcategory) => ({ value: subcategory, label: subcategory }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [categoryFilter, categoryOptions]);

  const queryParams: GetAdminServicesParams = useMemo(() => {
    const params: GetAdminServicesParams = { page, limit };

    if (debouncedSearch.trim()) params.searchTerm = debouncedSearch.trim();
    if (statusFilter !== "all") params.status = statusFilter as GetAdminServicesParams["status"];
    if (storeFilter !== "all") params.storeId = storeFilter;
    if (categoryFilter !== "all") params.category = categoryFilter;
    if (subcategoryFilter !== "all") params.subcategory = subcategoryFilter;
    if (typeFilters.length) params.type = typeFilters as ServiceType[];
    if (durationFilters.length) {
      params.durations = durationFilters.map((value) => Number(value));
    }

    return params;
  }, [
    debouncedSearch,
    statusFilter,
    storeFilter,
    categoryFilter,
    subcategoryFilter,
    typeFilters,
    durationFilters,
    page,
    limit,
  ]);

  const {
    data: servicesResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-services", queryParams],
    queryFn: () => getAdminServices(queryParams),
    retry: 1,
  });

  const services = useMemo(() => {
    return (servicesResponse?.data?.services || []).map((service) => ({
      ...service,
      id: service.id || (service as Service & { _id?: string })._id || "",
      createdAt: new Date(service.createdAt),
      updatedAt: new Date(service.updatedAt),
    }));
  }, [servicesResponse?.data?.services]);

  const paginationMeta = useMemo(
    () => normalizePaginationMeta(servicesResponse?.data?.meta, limit),
    [servicesResponse?.data?.meta, limit]
  );

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading services",
        description: error instanceof Error ? error.message : "Failed to fetch services",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const hasActiveFilters =
    statusFilter !== "all" ||
    storeFilter !== "all" ||
    categoryFilter !== "all" ||
    subcategoryFilter !== "all" ||
    typeFilters.length > 0 ||
    durationFilters.length > 0 ||
    Boolean(debouncedSearch.trim());

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setStoreFilter("all");
    setSelectedStoreLabel(null);
    setStoreSearch("");
    setDebouncedStoreSearch("");
    setCategoryFilter("all");
    setSubcategoryFilter("all");
    setTypeFilters([]);
    setDurationFilters([]);
    setPage(1);
  };

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      GBP: "£",
      USD: "$",
      NGN: "₦",
    };
    return `${symbols[currency] || currency}${price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Services"
        description="Review and manage vendor service offerings"
      />

      <div className="filter-bar flex-wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Search services..." />
        <FilterSearchSelect
          value={storeFilter}
          onChange={handleStoreFilterChange}
          placeholder="All stores"
          options={storeOptions}
          allLabel="All stores"
          searchPlaceholder="Search stores..."
          defaultVisibleCount={5}
          onSearchChange={setStoreSearch}
          selectedLabel={selectedStoreLabel ?? undefined}
          isLoading={isStoresLoading}
        />
        <FilterSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          placeholder="Category"
          options={categoryOptions.map(({ value, label }) => ({ value, label }))}
          allLabel="All categories"
        />
        <FilterSelect
          value={subcategoryFilter}
          onChange={setSubcategoryFilter}
          placeholder="Subcategory"
          options={subcategoryOptions}
          allLabel="All subcategories"
        />
        <FilterMultiSelect
          values={typeFilters}
          onChange={setTypeFilters}
          placeholder="Service type"
          options={SERVICE_TYPE_OPTIONS}
        />
        <FilterMultiSelect
          values={durationFilters}
          onChange={setDurationFilters}
          placeholder="Duration"
          options={DURATION_OPTIONS}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All statuses"
        />
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            Clear filters
          </Button>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton columns={9} rows={10} />
      ) : services.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No services found"
            description="Try adjusting your search or filter criteria"
            icon={<Briefcase className="h-6 w-6" />}
          />
        </div>
      ) : (
        <div className="card">
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Store</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {service.imageUrl ? (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-foreground">{service.store?.name || "—"}</td>
                    <td>
                      <p className="text-sm text-foreground">{service.category || "—"}</p>
                      {service.subcategory && (
                        <p className="text-xs text-muted-foreground">{service.subcategory}</p>
                      )}
                    </td>
                    <td className="text-sm text-muted-foreground">{formatServiceTypes(service.type)}</td>
                    <td>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(service.durationInMinutes)}</span>
                      </div>
                    </td>
                    <td className="font-medium text-foreground">
                      {formatPrice(service.price, service.currency)}
                    </td>
                    <td>
                      <StatusBadge status={service.status} />
                    </td>
                    <td className="text-muted-foreground">{formatDate(service.createdAt)}</td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          {service.status === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-success">
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border">
            {services.map((service) => (
              <div key={service.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.store?.name || "—"}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        View details
                      </DropdownMenuItem>
                      {service.status === "pending" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-success">
                            <Check className="h-4 w-4 mr-2" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <X className="h-4 w-4 mr-2" />
                            Reject
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusBadge status={service.status} />
                  {service.category && (
                    <span className="text-xs text-muted-foreground">
                      {service.category}
                      {service.subcategory ? ` · ${service.subcategory}` : ""}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>{formatServiceTypes(service.type)}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(service.durationInMinutes)}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {formatPrice(service.price, service.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {(paginationMeta.page - 1) * paginationMeta.limit + 1}–
                {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                {paginationMeta.total} services
              </div>
              <div className="pagination-controls">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!paginationMeta.hasPrevPage || isLoading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {paginationMeta.page} of {paginationMeta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!paginationMeta.hasNextPage || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
