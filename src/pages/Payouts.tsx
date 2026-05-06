import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Wallet, Calendar, User, Hash, Building2, CheckCircle2, Eye } from "lucide-react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getPayouts, approvePayout, type GetPayoutsParams, type ApprovePayoutPayload } from "@/services/payoutsApi";
import type { Payout } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function PayoutsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payoutMethodFilter, setPayoutMethodFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [approvingPayout, setApprovingPayout] = useState<Payout | null>(null);
  const [approveNotes, setApproveNotes] = useState("");
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
  }, [statusFilter, payoutMethodFilter, currencyFilter]);

  // Build query params
  const queryParams: GetPayoutsParams = useMemo(() => {
    const params: GetPayoutsParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter as "pending_approval" | "approved" | "processing" | "completed" | "failed" | "cancelled";
    }

    if (payoutMethodFilter !== "all") {
      params.payoutMethod = payoutMethodFilter as "bank_transfer" | "mobile_money" | "paypal" | "stripe_connect";
    }

    if (currencyFilter !== "all") {
      params.currency = currencyFilter as "NGN" | "GBP" | "USD";
    }

    return params;
  }, [debouncedSearch, statusFilter, payoutMethodFilter, currencyFilter, page, limit]);

  // Fetch payouts
  const {
    data: payoutsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["payouts", queryParams],
    queryFn: () => getPayouts(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const payouts = useMemo(() => {
    return (payoutsResponse?.data?.payouts || []).map((payout) => {
      const p = payout as Payout & {
        approvedAt?: string;
      };
      return {
        ...p,
        requestedAt: new Date(p.requestedAt),
        approvedAt: p.approvedAt ? new Date(p.approvedAt) : undefined,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      };
    });
  }, [payoutsResponse?.data?.payouts]);

  // Handle pagination meta (API returns totalDocs instead of total)
  const paginationMeta = useMemo(() => {
    const meta = payoutsResponse?.data?.meta;
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
  }, [payoutsResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading payouts",
        description: error instanceof Error ? error.message : "Failed to fetch payouts",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const statusOptions = [
    { value: "pending_approval", label: "Pending Approval" },
    { value: "approved", label: "Approved" },
    { value: "processing", label: "Processing" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const payoutMethodOptions = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "paypal", label: "PayPal" },
    { value: "stripe_connect", label: "Stripe Connect" },
  ];

  const currencyOptions = [
    { value: "GBP", label: "GBP" },
    { value: "USD", label: "USD" },
    { value: "NGN", label: "NGN" },
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

  // Approve payout mutation
  const approveMutation = useMutation({
    mutationFn: ({ payoutReference, payload }: { payoutReference: string; payload: ApprovePayoutPayload }) =>
      approvePayout(payoutReference, payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Payout approved successfully",
        variant: "success",
      });
      setIsApproveDialogOpen(false);
      setApprovingPayout(null);
      setApproveNotes("");
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error approving payout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle approve click
  const handleApproveClick = (payout: Payout) => {
    setApprovingPayout(payout);
    setIsApproveDialogOpen(true);
  };

  // Handle approve submit
  const handleApproveSubmit = () => {
    if (!approvingPayout) return;
    
    const payload: ApprovePayoutPayload = {};
    if (approveNotes.trim()) {
      payload.notes = approveNotes.trim();
    }
    
    approveMutation.mutate({
      payoutReference: approvingPayout.payoutReference,
      payload,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payouts"
        description="Manage vendor payouts and transactions"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search payouts..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Statuses"
        />
        <FilterSelect
          value={payoutMethodFilter}
          onChange={setPayoutMethodFilter}
          placeholder="Payout Method"
          options={payoutMethodOptions}
          allLabel="All Methods"
        />
        <FilterSelect
          value={currencyFilter}
          onChange={setCurrencyFilter}
          placeholder="Currency"
          options={currencyOptions}
          allLabel="All Currencies"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} rows={10} />
      ) : payouts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Wallet className="h-12 w-12" />}
            title="No payouts found"
            description={
              search || statusFilter !== "all" || payoutMethodFilter !== "all" || currencyFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Payouts will appear here once vendors request withdrawals"
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
                  <th>Reference</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((payout) => (
                  <tr key={payout.id}>
                    <td><span className="font-mono text-foreground text-sm">{payout.payoutReference}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(payout.bankAccount.accountName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground capitalize">{payout.bankAccount.accountName}</p>
                          <p className="text-xs text-muted-foreground">Vendor ID: {payout.wallet.vendor.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td><p className="font-medium text-foreground">{formatPrice(payout.amount, payout.currency)}</p></td>
                    <td className="text-muted-foreground capitalize">{payout.payoutMethod.replace(/_/g, " ")}</td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm text-foreground">{payout.bankAccount.accountName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{payout.bankAccount.accountNumber}</p>
                        <p className="text-xs text-muted-foreground">{payout.bankAccount.bankName}</p>
                      </div>
                    </td>
                    <td><StatusBadge status={payout.status} /></td>
                    <td>
                      <p className="text-foreground">{formatDate(payout.requestedAt)}</p>
                      <p className="text-xs text-muted-foreground">Requested</p>
                    </td>
                    <td className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedPayout(payout); setIsSheetOpen(true); }} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />View
                          </DropdownMenuItem>
                          {payout.status === "pending_approval" && (
                            <DropdownMenuItem onClick={() => handleApproveClick(payout)} className="cursor-pointer text-green-600 focus:text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-2" />Approve
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {payouts.map((payout) => (
              <div key={payout.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-foreground truncate">{payout.payoutReference}</p>
                    <p className="font-medium text-foreground capitalize mt-1">{payout.bankAccount.accountName}</p>
                    <p className="text-xs text-muted-foreground">{payout.bankAccount.bankName}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedPayout(payout); setIsSheetOpen(true); }} className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />View
                      </DropdownMenuItem>
                      {payout.status === "pending_approval" && (
                        <DropdownMenuItem onClick={() => handleApproveClick(payout)} className="cursor-pointer text-green-600 focus:text-green-600">
                          <CheckCircle2 className="h-4 w-4 mr-2" />Approve
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusBadge status={payout.status} />
                  <span className="text-xs text-muted-foreground capitalize">{payout.payoutMethod.replace(/_/g, " ")}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground text-sm">{formatPrice(payout.amount, payout.currency)}</span>
                  <span className="text-muted-foreground">{formatDate(payout.requestedAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1}–{Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of {paginationMeta.total} payouts
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

      {/* Payout Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl h-auto overflow-y-auto m-3 rounded-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Payout Details
            </SheetTitle>
            <SheetDescription>
              View complete information about the payout
            </SheetDescription>
          </SheetHeader>

          {selectedPayout && (
            <div className="space-y-6 py-4">
              {/* Payout Reference */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Payout Reference
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Payout ID
                    </label>
                    <p className="text-sm font-mono font-medium text-foreground">
                      {selectedPayout.id}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Payout Reference
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedPayout.payoutReference}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Transaction Reference
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedPayout.transactionReference}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Transaction ID
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedPayout.transactionId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Wallet Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Wallet Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Wallet ID
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedPayout.wallet.id}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Vendor ID
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedPayout.wallet.vendor}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Currency
                    </label>
                    <p className="text-sm text-foreground uppercase">
                      {selectedPayout.wallet.currency}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Pending Balance
                    </label>
                    <p className="text-sm text-foreground">
                      {formatPrice(selectedPayout.wallet.pendingBalance, selectedPayout.wallet.currency)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Available Balance
                    </label>
                    <p className="text-sm text-foreground">
                      {formatPrice(selectedPayout.wallet.availableBalance, selectedPayout.wallet.currency)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Total Lifetime Earnings
                    </label>
                    <p className="text-sm text-foreground">
                      {formatPrice(selectedPayout.wallet.totalLifetimeEarnings, selectedPayout.wallet.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payout Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Payout Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Amount
                    </label>
                    <p className="text-lg font-bold text-foreground">
                      {formatPrice(selectedPayout.amount, selectedPayout.currency)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Currency
                    </label>
                    <p className="text-sm text-foreground uppercase">
                      {selectedPayout.currency}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Status
                    </label>
                    <div>
                      <StatusBadge status={selectedPayout.status} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <p className="text-sm text-foreground capitalize">
                      {selectedPayout.category.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Payout Method
                    </label>
                    <p className="text-sm text-foreground capitalize">
                      {selectedPayout.payoutMethod.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Payment Gateway
                    </label>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm text-foreground capitalize">
                        {selectedPayout.paymentGateway}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank Account Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Bank Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Account Name
                    </label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">
                        {selectedPayout.bankAccount.accountName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Account Number
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedPayout.bankAccount.accountNumber}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Bank Name
                    </label>
                    <p className="text-sm text-foreground">
                      {selectedPayout.bankAccount.bankName}
                    </p>
                  </div>

                  {selectedPayout.bankAccount.bankCode && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Bank Code
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedPayout.bankAccount.bankCode}
                      </p>
                    </div>
                  )}

                  {selectedPayout.bankAccount.sortCode && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Sort Code
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedPayout.bankAccount.sortCode}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedPayout.notes && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Notes
                  </h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedPayout.notes}
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
                      Requested At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedPayout.requestedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedPayout.requestedAt).split(", ")[1]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(selectedPayout as any).approvedAt && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Approved At
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-foreground">
                            {formatDate((selectedPayout as any).approvedAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime((selectedPayout as any).approvedAt).split(", ")[1]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Created At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedPayout.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedPayout.createdAt).split(", ")[1]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Updated At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedPayout.updatedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedPayout.updatedAt).split(", ")[1]}
                        </p>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve Payout Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this payout request? This action will process the payment.
            </DialogDescription>
          </DialogHeader>

          {approvingPayout && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="approve-notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="approve-notes"
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setApprovingPayout(null);
                setApproveNotes("");
              }}
              disabled={approveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveSubmit}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? "Approving..." : "Approve Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

