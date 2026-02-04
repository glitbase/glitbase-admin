import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Check, X, Eye, Briefcase, Clock, Loader2 } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
  EmptyState,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getServices, type GetServicesParams } from "@/services/servicesApi";
import type { Service } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
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

  // Reset page when status filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Build query params
  const queryParams: GetServicesParams = useMemo(() => {
    const params: GetServicesParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.searchTerm = debouncedSearch;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter as "pending" | "approved" | "rejected";
    }

    return params;
  }, [debouncedSearch, statusFilter, page, limit]);

  // Fetch services
  const {
    data: servicesResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["services", queryParams],
    queryFn: () => getServices(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const services = useMemo(() => {
    return (servicesResponse?.data?.services || []).map((service) => ({
      ...service,
      createdAt: new Date(service.createdAt),
      updatedAt: new Date(service.updatedAt),
    }));
  }, [servicesResponse?.data?.services]);

  const paginationMeta = servicesResponse?.data?.meta;

  // Handle errors
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

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      GBP: "£",
      USD: "$",
      NGN: "₦",
    };
    return `${symbols[currency] || currency}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      });
    };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Services"
        description="Review and manage vendor service offerings"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search services..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            title="No services found"
            description="Try adjusting your search or filter criteria"
            icon={<Briefcase className="h-6 w-6" />}
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Store</th>
                  <th>Category</th>
                  <th>Duration</th>
                  <th>Price</th>
                  <th>Status</th>
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
                        <p className="font-medium text-foreground">
                          {service.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {service?.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="text-foreground">{service.store?.name || "—"}</td>
                  <td className="text-muted-foreground">
                    {service.category || "—"}
                  </td>
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
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
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
            
            {/* Pagination */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1} to{" "}
                  {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                  {paginationMeta.total} services
                </div>
                <div className="flex items-center gap-2">
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
          </>
        )}
      </div>
    </div>
  );
}
