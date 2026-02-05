import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, Calendar, Loader2 } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
  EmptyState,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getBookings, type GetBookingsParams } from "@/services/bookingsApi";
import type { Booking } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BookingsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, serviceTypeFilter, sortBy]);

  // Build query params
  const queryParams: GetBookingsParams = useMemo(() => {
    const params: GetBookingsParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter as "pending" | "confirmed" | "ongoing" | "completed" | "rejected" | "refunded" | "cancelled";
    }

    if (serviceTypeFilter !== "all") {
      params.serviceType = serviceTypeFilter as "normal" | "home" | "pickDrop";
    }

    if (sortBy !== "newest") {
      params.sortBy = sortBy as "newest" | "oldest" | "customerName";
    }

    return params;
  }, [debouncedSearch, statusFilter, serviceTypeFilter, sortBy, page, limit]);

  // Fetch bookings
  const {
    data: bookingsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["bookings", queryParams],
    queryFn: () => getBookings(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const bookings = useMemo(() => {
    return (bookingsResponse?.data?.bookings || []).map((booking) => ({
      ...booking,
      serviceDate: new Date(booking.serviceDate),
      createdAt: new Date(booking.createdAt),
      updatedAt: new Date(booking.updatedAt),
    }));
  }, [bookingsResponse?.data?.bookings]);

  // Handle pagination meta (API returns totalDocs instead of total)
  const paginationMeta = useMemo(() => {
    const meta = bookingsResponse?.data?.meta;
    if (!meta) return undefined;
    
    // Handle inconsistent API response format
    const rawMeta = meta as unknown as Record<string, unknown>;
    
    return {
      ...meta,
      page: typeof meta.page === 'string' ? parseInt(meta.page) : meta.page,
      limit: typeof meta.limit === 'string' ? parseInt(meta.limit) : meta.limit,
      total: (rawMeta.totalDocs as number) || meta.total || 0,
      hasPrevPage: (rawMeta.hasPreviousPage as boolean) ?? meta.hasPrevPage,
    };
  }, [bookingsResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading bookings",
        description: error instanceof Error ? error.message : "Failed to fetch bookings",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "rejected", label: "Rejected" },
    { value: "refunded", label: "Refunded" },
  ];

  const serviceTypeOptions = [
    { value: "normal", label: "Normal" },
    { value: "home", label: "Home" },
    { value: "pickDrop", label: "Pick & Drop" },
  ];

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "customerName", label: "Customer Name" },
  ];

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      GBP: "£",
      USD: "$",
      NGN: "₦",
    };
    return `${symbols[currency] || currency}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const names = name.trim().split(" ");
    return names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bookings"
        description="Manage customer service bookings"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search bookings..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Statuses"
        />
        <FilterSelect
          value={serviceTypeFilter}
          onChange={setServiceTypeFilter}
          placeholder="Service Type"
          options={serviceTypeOptions}
          allLabel="All Service Types"
        />
        <FilterSelect
          value={sortBy}
          onChange={setSortBy}
          placeholder="Sort By"
          options={sortOptions}
          showAll={false}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No bookings found"
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Bookings will appear here once customers make appointments"
          }
        />
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Store</th>
                  <th>Service Type</th>
                  <th>Service Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <p className="font-medium text-foreground">
                        {booking.bookingReference}
                      </p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(booking.contactInfo.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {booking.contactInfo.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.contactInfo.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-foreground">
                        {booking.store.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.store.location?.city || "—"}
                      </p>
                    </td>
                    <td className="text-muted-foreground capitalize">
                      {booking.serviceType}
                    </td>
                    <td>
                      <p className="text-foreground">{formatDate(booking.serviceDate)}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.serviceTime}
                      </p>
                    </td>
                    <td>
                      <p className="font-medium text-foreground">
                        {formatPrice(booking.pricing.subtotal, booking.pricing.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Paid: {formatPrice(booking.pricing.amountPaid, booking.pricing.currency)}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1} to{" "}
                {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                {paginationMeta.total} bookings
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
        </div>
      )}
    </div>
  );
}

