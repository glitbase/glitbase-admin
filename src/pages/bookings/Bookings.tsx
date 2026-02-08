import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Calendar, Eye, XCircle, RotateCcw, Edit, Gavel } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  getBookings,
  forceCancelBooking,
  manualRefund,
  updateBookingStatus,
  resolveDispute,
  type GetBookingsParams,
  type ForceCancelBookingPayload,
  type ManualRefundPayload,
  type UpdateBookingStatusPayload,
  type ResolveDisputePayload,
} from "@/services/bookingsApi";
import type { Booking } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [isResolveDisputeDialogOpen, setIsResolveDisputeDialogOpen] = useState(false);
  const [actionBooking, setActionBooking] = useState<Booking | null>(null);
  
  // Cancel form state
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefundType, setCancelRefundType] = useState<"full" | "partial" | "none">("full");
  const [cancelCustomAmount, setCancelCustomAmount] = useState("");
  const [cancelAdminNotes, setCancelAdminNotes] = useState("");
  
  // Refund form state
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundAdminNotes, setRefundAdminNotes] = useState("");
  const [refundNotifyCustomer, setRefundNotifyCustomer] = useState(true);
  const [refundNotifyVendor, setRefundNotifyVendor] = useState(true);
  
  // Update status form state
  const [updateStatus, setUpdateStatus] = useState<string>("");
  const [updateStage, setUpdateStage] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [updateAdminNotes, setUpdateAdminNotes] = useState("");
  const [updateNotifyCustomer, setUpdateNotifyCustomer] = useState(true);
  const [updateNotifyVendor, setUpdateNotifyVendor] = useState(true);
  
  // Resolve dispute form state
  const [disputeResolution, setDisputeResolution] = useState<"favor_customer" | "favor_vendor" | "split" | "no_action">("favor_customer");
  const [disputeResolutionNotes, setDisputeResolutionNotes] = useState("");
  const [disputeCustomerRefundPercentage, setDisputeCustomerRefundPercentage] = useState("");
  const [disputeFinalStatus, setDisputeFinalStatus] = useState("");
  const [disputeAdminNotes, setDisputeAdminNotes] = useState("");
  
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

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    if (!name) return "??";
    const names = name.trim().split(" ");
    return names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: ({ reference, payload }: { reference: string; payload: ForceCancelBookingPayload }) =>
      forceCancelBooking(reference, payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking cancelled successfully",
        variant: "success",
      });
      setIsCancelDialogOpen(false);
      resetCancelForm();
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error cancelling booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ reference, payload }: { reference: string; payload: ManualRefundPayload }) =>
      manualRefund(reference, payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Refund processed successfully",
        variant: "success",
      });
      setIsRefundDialogOpen(false);
      resetRefundForm();
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error processing refund",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ reference, payload }: { reference: string; payload: UpdateBookingStatusPayload }) =>
      updateBookingStatus(reference, payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking status updated successfully",
        variant: "success",
      });
      setIsUpdateStatusDialogOpen(false);
      resetUpdateStatusForm();
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: ({ reference, payload }: { reference: string; payload: ResolveDisputePayload }) =>
      resolveDispute(reference, payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dispute resolved successfully",
        variant: "success",
      });
      setIsResolveDisputeDialogOpen(false);
      resetResolveDisputeForm();
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error resolving dispute",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form functions
  const resetCancelForm = () => {
    setActionBooking(null);
    setCancelReason("");
    setCancelRefundType("full");
    setCancelCustomAmount("");
    setCancelAdminNotes("");
  };

  const resetRefundForm = () => {
    setActionBooking(null);
    setRefundAmount("");
    setRefundReason("");
    setRefundAdminNotes("");
    setRefundNotifyCustomer(true);
    setRefundNotifyVendor(true);
  };

  const resetUpdateStatusForm = () => {
    setActionBooking(null);
    setUpdateStatus("");
    setUpdateStage("");
    setUpdateReason("");
    setUpdateAdminNotes("");
    setUpdateNotifyCustomer(true);
    setUpdateNotifyVendor(true);
  };

  const resetResolveDisputeForm = () => {
    setActionBooking(null);
    setDisputeResolution("favor_customer");
    setDisputeResolutionNotes("");
    setDisputeCustomerRefundPercentage("");
    setDisputeFinalStatus("");
    setDisputeAdminNotes("");
  };

  // Handle action clicks
  const handleCancelClick = (booking: Booking) => {
    setActionBooking(booking);
    setIsCancelDialogOpen(true);
  };

  const handleRefundClick = (booking: Booking) => {
    setActionBooking(booking);
    setIsRefundDialogOpen(true);
  };

  const handleUpdateStatusClick = (booking: Booking) => {
    setActionBooking(booking);
    setUpdateStatus(booking.status);
    setIsUpdateStatusDialogOpen(true);
  };

  const handleResolveDisputeClick = (booking: Booking) => {
    setActionBooking(booking);
    setIsResolveDisputeDialogOpen(true);
  };

  // Handle form submissions
  const handleCancelSubmit = () => {
    if (!actionBooking || !cancelReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Reason is required",
        variant: "destructive",
      });
      return;
    }

    const payload: ForceCancelBookingPayload = {
      reason: cancelReason.trim(),
      refundType: cancelRefundType,
      adminNotes: cancelAdminNotes.trim() || undefined,
    };

    if (cancelRefundType === "partial" && cancelCustomAmount) {
      payload.customRefundAmount = parseFloat(cancelCustomAmount);
    }

    cancelMutation.mutate({ reference: actionBooking.bookingReference, payload });
  };

  const handleRefundSubmit = () => {
    if (!actionBooking || !refundAmount || !refundReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Refund amount and reason are required",
        variant: "destructive",
      });
      return;
    }

    const payload: ManualRefundPayload = {
      refundAmount: parseFloat(refundAmount),
      reason: refundReason.trim(),
      adminNotes: refundAdminNotes.trim() || undefined,
      notifyCustomer: refundNotifyCustomer,
      notifyVendor: refundNotifyVendor,
    };

    refundMutation.mutate({ reference: actionBooking.bookingReference, payload });
  };

  const handleUpdateStatusSubmit = () => {
    if (!actionBooking || !updateStatus) {
      toast({
        title: "Validation Error",
        description: "Status is required",
        variant: "destructive",
      });
      return;
    }

    const payload: UpdateBookingStatusPayload = {
      status: updateStatus as any,
      stage: updateStage.trim() || undefined,
      reason: updateReason.trim() || undefined,
      adminNotes: updateAdminNotes.trim() || undefined,
      notifyCustomer: updateNotifyCustomer,
      notifyVendor: updateNotifyVendor,
    };

    updateStatusMutation.mutate({ reference: actionBooking.bookingReference, payload });
  };

  const handleResolveDisputeSubmit = () => {
    if (!actionBooking || !disputeResolutionNotes.trim()) {
      toast({
        title: "Validation Error",
        description: "Resolution notes are required",
        variant: "destructive",
      });
      return;
    }

    const payload: ResolveDisputePayload = {
      resolution: disputeResolution,
      resolutionNotes: disputeResolutionNotes.trim(),
      customerRefundPercentage: disputeResolution === "split" && disputeCustomerRefundPercentage
        ? parseFloat(disputeCustomerRefundPercentage)
        : undefined,
      finalStatus: disputeFinalStatus || undefined,
      adminNotes: disputeAdminNotes.trim() || undefined,
    };

    resolveDisputeMutation.mutate({ reference: actionBooking.bookingReference, payload });
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
        <TableSkeleton columns={8} rows={10} />
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsSheetOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleRefundClick(booking)}
                            className="cursor-pointer"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Process Refund
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatusClick(booking)}
                            className="cursor-pointer"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleResolveDisputeClick(booking)}
                            className="cursor-pointer"
                          >
                            <Gavel className="h-4 w-4 mr-2" />
                            Resolve Dispute
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleCancelClick(booking)}
                            className="cursor-pointer text-red-600 focus:text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Booking Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl h-auto overflow-y-auto m-3 rounded-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Booking Details
            </SheetTitle>
            <SheetDescription>
              View complete information about the booking
            </SheetDescription>
          </SheetHeader>

          {selectedBooking && (
            <div className="space-y-6 py-4">
              {/* Booking Reference */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Booking Reference
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Booking ID
                    </label>
                    <p className="text-sm font-mono font-medium text-foreground">
                      {selectedBooking.id}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Booking Reference
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedBooking.bookingReference}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      User ID
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedBooking.user}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Name
                    </label>
                    <p className="text-sm font-medium text-foreground capitalize">
                      {selectedBooking.contactInfo.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-sm text-foreground">
                      {selectedBooking.contactInfo.email}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Phone
                    </label>
                    <p className="text-sm text-foreground">
                      {selectedBooking.contactInfo.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Store Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Store ID
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedBooking.store.id}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Store Name
                    </label>
                    <p className="text-sm font-medium text-foreground">
                      {selectedBooking.store.name}
                    </p>
                  </div>
                  {selectedBooking.store.location && (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Address
                        </label>
                        <p className="text-sm text-foreground">
                          {selectedBooking.store.location.address}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          City
                        </label>
                        <p className="text-sm text-foreground">
                          {selectedBooking.store.location.city}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          State
                        </label>
                        <p className="text-sm text-foreground">
                          {selectedBooking.store.location.state}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Service Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Service Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Service Type
                    </label>
                    <p className="text-sm text-foreground capitalize">
                      {selectedBooking.serviceType}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Service Date
                    </label>
                    <p className="text-sm text-foreground">
                      {formatDate(selectedBooking.serviceDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Service Time
                    </label>
                    <p className="text-sm text-foreground">
                      {selectedBooking.serviceTime}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Status
                    </label>
                    <div>
                      <StatusBadge status={selectedBooking.status} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Pricing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Subtotal
                    </label>
                    <p className="text-lg font-bold text-foreground">
                      {formatPrice(selectedBooking.pricing.subtotal, selectedBooking.pricing.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Amount Paid
                    </label>
                    <p className="text-sm text-foreground">
                      {formatPrice(selectedBooking.pricing.amountPaid, selectedBooking.pricing.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Remaining Balance
                    </label>
                    <p className="text-sm text-foreground">
                      {formatPrice(selectedBooking.pricing.remainingBalance, selectedBooking.pricing.currency)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Currency
                    </label>
                    <p className="text-sm text-foreground uppercase">
                      {selectedBooking.pricing.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {selectedBooking.payment && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Payment Reference
                      </label>
                      <p className="text-sm font-mono text-foreground">
                        {selectedBooking.payment.paymentReference}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Payment Status
                      </label>
                      <StatusBadge status={selectedBooking.payment.status} />
                    </div>
                    {selectedBooking.payment.paidAt && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Paid At
                        </label>
                        <p className="text-sm text-foreground">
                          {formatDateTime(selectedBooking.payment.paidAt)}
                        </p>
                      </div>
                    )}
                  </div>
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
                    <p className="text-sm text-foreground">
                      {formatDateTime(selectedBooking.createdAt)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Updated At
                    </label>
                    <p className="text-sm text-foreground">
                      {formatDateTime(selectedBooking.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Cancel Booking Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Force Cancel Booking</DialogTitle>
            <DialogDescription>
              Cancel this booking regardless of current status. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {actionBooking && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Policy violation / Emergency / etc"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancel-refund-type">
                  Refund Type <span className="text-destructive">*</span>
                </Label>
                <Select value={cancelRefundType} onValueChange={(value: "full" | "partial" | "none") => setCancelRefundType(value)}>
                  <SelectTrigger id="cancel-refund-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Refund</SelectItem>
                    <SelectItem value="partial">Partial Refund</SelectItem>
                    <SelectItem value="none">No Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {cancelRefundType === "partial" && (
                <div className="space-y-2">
                  <Label htmlFor="cancel-custom-amount">
                    Custom Refund Amount
                  </Label>
                  <Input
                    id="cancel-custom-amount"
                    type="number"
                    value={cancelCustomAmount}
                    onChange={(e) => setCancelCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cancel-admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="cancel-admin-notes"
                  value={cancelAdminNotes}
                  onChange={(e) => setCancelAdminNotes(e.target.value)}
                  placeholder="Internal notes about this cancellation"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelDialogOpen(false);
                resetCancelForm();
              }}
              disabled={cancelMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubmit}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Manual Refund</DialogTitle>
            <DialogDescription>
              Process a manual refund for this booking. The refund will be processed via the payment gateway.
            </DialogDescription>
          </DialogHeader>

          {actionBooking && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="refund-amount">
                  Refund Amount <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="refund-amount"
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Enter refund amount"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum refundable: {formatPrice(actionBooking.pricing.amountPaid, actionBooking.pricing.currency)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-reason">
                  Reason <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g., Goodwill gesture / Failed auto-refund / etc"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="refund-admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="refund-admin-notes"
                  value={refundAdminNotes}
                  onChange={(e) => setRefundAdminNotes(e.target.value)}
                  placeholder="Internal notes about this refund"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="refund-notify-customer">Notify Customer</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification email to customer
                  </p>
                </div>
                <Switch
                  id="refund-notify-customer"
                  checked={refundNotifyCustomer}
                  onCheckedChange={setRefundNotifyCustomer}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="refund-notify-vendor">Notify Vendor</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification email to vendor
                  </p>
                </div>
                <Switch
                  id="refund-notify-vendor"
                  checked={refundNotifyVendor}
                  onCheckedChange={setRefundNotifyVendor}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRefundDialogOpen(false);
                resetRefundForm();
              }}
              disabled={refundMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefundSubmit}
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? "Processing..." : "Process Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Booking Status</DialogTitle>
            <DialogDescription>
              Update the booking status and optionally change the stage.
            </DialogDescription>
          </DialogHeader>

          {actionBooking && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="update-status">
                  Status <span className="text-destructive">*</span>
                </Label>
                <Select value={updateStatus} onValueChange={setUpdateStatus}>
                  <SelectTrigger id="update-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-stage">Stage (Optional)</Label>
                <Select value={updateStage} onValueChange={setUpdateStage}>
                  <SelectTrigger id="update-stage">
                    <SelectValue placeholder="Select stage (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="readyToServe">Ready To Serve</SelectItem>
                    <SelectItem value="vendorEnroute">Vendor Enroute</SelectItem>
                    <SelectItem value="vendorArrived">Vendor Arrived</SelectItem>
                    <SelectItem value="itemReceived">Item Received</SelectItem>
                    <SelectItem value="inProgress">In Progress</SelectItem>
                    <SelectItem value="readyForPickup">Ready For Pickup</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-reason">Reason (Optional)</Label>
                <Textarea
                  id="update-reason"
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  placeholder="e.g., System error correction / Manual intervention / etc"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="update-admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="update-admin-notes"
                  value={updateAdminNotes}
                  onChange={(e) => setUpdateAdminNotes(e.target.value)}
                  placeholder="Internal notes about this status change"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="update-notify-customer">Notify Customer</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification email to customer
                  </p>
                </div>
                <Switch
                  id="update-notify-customer"
                  checked={updateNotifyCustomer}
                  onCheckedChange={setUpdateNotifyCustomer}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="update-notify-vendor">Notify Vendor</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification email to vendor
                  </p>
                </div>
                <Switch
                  id="update-notify-vendor"
                  checked={updateNotifyVendor}
                  onCheckedChange={setUpdateNotifyVendor}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUpdateStatusDialogOpen(false);
                resetUpdateStatusForm();
              }}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatusSubmit}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Dispute Dialog */}
      <Dialog open={isResolveDisputeDialogOpen} onOpenChange={setIsResolveDisputeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Resolve a dispute for this booking. Refunds will be processed automatically based on the resolution.
            </DialogDescription>
          </DialogHeader>

          {actionBooking && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dispute-resolution">
                  Resolution <span className="text-destructive">*</span>
                </Label>
                <Select value={disputeResolution} onValueChange={(value: "favor_customer" | "favor_vendor" | "split" | "no_action") => setDisputeResolution(value)}>
                  <SelectTrigger id="dispute-resolution">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="favor_customer">Favor Customer (Full Refund)</SelectItem>
                    <SelectItem value="favor_vendor">Favor Vendor (No Refund)</SelectItem>
                    <SelectItem value="split">Split (Partial Refund)</SelectItem>
                    <SelectItem value="no_action">No Action (No Refund)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispute-resolution-notes">
                  Resolution Notes <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="dispute-resolution-notes"
                  value={disputeResolutionNotes}
                  onChange={(e) => setDisputeResolutionNotes(e.target.value)}
                  placeholder="Detailed explanation of resolution"
                  rows={4}
                />
              </div>

              {disputeResolution === "split" && (
                <div className="space-y-2">
                  <Label htmlFor="dispute-customer-refund-percentage">
                    Customer Refund Percentage (0-100)
                  </Label>
                  <Input
                    id="dispute-customer-refund-percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={disputeCustomerRefundPercentage}
                    onChange={(e) => setDisputeCustomerRefundPercentage(e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="dispute-final-status">Final Status (Optional)</Label>
                <Select value={disputeFinalStatus} onValueChange={setDisputeFinalStatus}>
                  <SelectTrigger id="dispute-final-status">
                    <SelectValue placeholder="Select final status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dispute-admin-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="dispute-admin-notes"
                  value={disputeAdminNotes}
                  onChange={(e) => setDisputeAdminNotes(e.target.value)}
                  placeholder="Internal notes about this resolution"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsResolveDisputeDialogOpen(false);
                resetResolveDisputeForm();
              }}
              disabled={resolveDisputeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolveDisputeSubmit}
              disabled={resolveDisputeMutation.isPending}
            >
              {resolveDisputeMutation.isPending ? "Resolving..." : "Resolve Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

