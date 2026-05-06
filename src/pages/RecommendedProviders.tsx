import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Star, Building2, MapPin, Phone, Calendar } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getRecommendedProviders, type GetRecommendedProvidersParams } from "@/services/recommendedProvidersApi";
import type { RecommendedProvider } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function RecommendedProvidersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<RecommendedProvider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const limit = 20;
  const { toast } = useToast();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // Reset to page 1 when search changes
      if (search !== debouncedSearch) {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [businessTypeFilter, cityFilter]);

  // Build query params
  const queryParams: GetRecommendedProvidersParams = useMemo(() => {
    const params: GetRecommendedProvidersParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (businessTypeFilter && businessTypeFilter !== "all") {
      params.businessType = businessTypeFilter;
    }

    if (cityFilter) {
      params.city = cityFilter;
    }

    return params;
  }, [debouncedSearch, businessTypeFilter, cityFilter, page, limit]);

  // Fetch recommended providers
  const {
    data: providersResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["recommended-providers", queryParams],
    queryFn: () => getRecommendedProviders(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const providers = useMemo(() => {
    return (providersResponse?.data?.recommendations || []).map((provider) => ({
      ...provider,
      createdAt: new Date(provider.createdAt),
      updatedAt: new Date(provider.updatedAt),
    }));
  }, [providersResponse?.data?.recommendations]);

  // Handle pagination meta
  const paginationMeta = useMemo(() => {
    const meta = providersResponse?.data?.meta;
    if (!meta) return undefined;
    
    // Handle inconsistent API response format
    const rawMeta = meta as unknown as Record<string, unknown>;
    
    return {
      ...meta,
      page: typeof meta.page === 'string' ? parseInt(meta.page) : meta.page,
      limit: typeof meta.limit === 'string' ? parseInt(meta.limit) : meta.limit,
      total: (rawMeta.totalDocs as number) || meta.total || 0,
      hasPrevPage: (rawMeta.hasPreviousPage as boolean) ?? meta.hasPrevPage ?? false,
    };
  }, [providersResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading providers",
        description: error instanceof Error ? error.message : "Failed to fetch recommended providers",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const businessTypeOptions = [
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Recommended Providers"
        description="Manage recommended providers for users"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search providers..."
        />
        <FilterSelect
          value={businessTypeFilter}
          onChange={setBusinessTypeFilter}
          placeholder="Business Type"
          options={businessTypeOptions}
          allLabel="All Business Types"
        />
        <input
          type="text"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          placeholder="City"
          className="h-9 w-full sm:w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} rows={10} />
      ) : providers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Star className="h-12 w-12" />}
            title="No providers found"
            description={
              search || businessTypeFilter !== "all" || cityFilter
                ? "Try adjusting your search or filters"
                : "Recommended providers will appear here once they are added"
            }
          />
        </div>
      ) : (
        <div className="card">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Business Type</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Reason</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider) => (
                  <tr key={provider.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">{provider.businessName}</span>
                      </div>
                    </td>
                    <td><span className="text-sm text-foreground capitalize">{provider.businessType}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-foreground">{provider.contact}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 max-w-[200px]">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">{provider.location || provider.city}</span>
                      </div>
                    </td>
                    <td>
                      {provider.reason ? (
                        <span className="text-sm text-foreground max-w-[250px] block truncate">{provider.reason}</span>
                      ) : <span className="text-sm text-muted-foreground">—</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-foreground">{formatDate(provider.createdAt)}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedProvider(provider); setIsDialogOpen(true); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {providers.map((provider) => (
              <div key={provider.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="font-medium text-foreground">{provider.businessName}</p>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{provider.businessType}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedProvider(provider); setIsDialogOpen(true); }} className="shrink-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{provider.contact}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{provider.location || provider.city}</span>
                  </div>
                </div>
                {provider.reason && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{provider.reason}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(provider.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1}–{Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of {paginationMeta.total} providers
              </div>
              <div className="pagination-controls">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!paginationMeta.hasPrevPage || isLoading}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {paginationMeta.page} of {paginationMeta.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!paginationMeta.hasNextPage || isLoading}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Provider Details Sheet */}
      <Sheet open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl h-auto overflow-y-auto m-3 rounded-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Provider Details
            </SheetTitle>
            <SheetDescription>
              View complete information about the recommended provider
            </SheetDescription>
          </SheetHeader>

          {selectedProvider && (
            <div className="space-y-6 py-4">
              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Business Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Business Name
                    </label>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedProvider.businessName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Business Type
                    </label>
                    <p className="text-sm text-foreground capitalize">
                      {selectedProvider.businessType}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Contact
                    </label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-foreground">
                        {selectedProvider.contact}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      City
                    </label>
                    <p className="text-sm text-foreground">
                      {selectedProvider.city}
                    </p>
                  </div>
                </div>

                {selectedProvider.location && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Location
                    </label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-foreground">
                        {selectedProvider.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              {selectedProvider.reason && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Recommendation Reason
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedProvider.reason}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Timestamps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Created At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-foreground">
                        {formatDate(selectedProvider.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Updated At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-foreground">
                        {formatDate(selectedProvider.updatedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

