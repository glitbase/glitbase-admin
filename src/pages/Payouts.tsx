import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, Wallet, Loader2 } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
  EmptyState,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getPayouts, type GetPayoutsParams } from "@/services/payoutsApi";
import type { Payout } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function PayoutsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [payoutMethodFilter, setPayoutMethodFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
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
    return (payoutsResponse?.data?.payouts || []).map((payout) => ({
      ...payout,
      requestedAt: new Date(payout.requestedAt),
      createdAt: new Date(payout.createdAt),
      updatedAt: new Date(payout.updatedAt),
    }));
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

  const getInitials = (name: string) => {
    if (!name) return "??";
    const names = name.trim().split(" ");
    return names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
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
          <div className="overflow-x-auto">
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
                    <td>
                      <span className="font-mono text-foreground text-sm">
                        {payout.payoutReference}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(payout.bankAccount.accountName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {payout.bankAccount.accountName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Vendor ID: {payout.wallet.vendor.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-foreground">
                        {formatPrice(payout.amount, payout.currency)}
                      </p>
                    </td>
                    <td className="text-muted-foreground capitalize">
                      {payout.payoutMethod.replace(/_/g, " ")}
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-sm text-foreground">
                          {payout.bankAccount.accountName}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {payout.bankAccount.accountNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payout.bankAccount.bankName}
                        </p>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={payout.status} />
                    </td>
                    <td>
                      <p className="text-foreground">{formatDate(payout.requestedAt)}</p>
                      <p className="text-xs text-muted-foreground">
                        Requested
                      </p>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/payouts/${payout.id}`)}
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
                {paginationMeta.total} payouts
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

