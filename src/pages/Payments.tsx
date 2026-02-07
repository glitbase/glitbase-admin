import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, CreditCard } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getPayments, type GetPaymentsParams } from "@/services/paymentsApi";
import type { Payment } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [paymentGatewayFilter, setPaymentGatewayFilter] = useState<string>("all");
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
  }, [statusFilter, paymentMethodFilter, paymentGatewayFilter, currencyFilter]);

  // Build query params
  const queryParams: GetPaymentsParams = useMemo(() => {
    const params: GetPaymentsParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter as "pending" | "completed" | "failed" | "refunded";
    }

    if (paymentMethodFilter !== "all") {
      params.paymentMethod = paymentMethodFilter as "card" | "bank_transfer" | "wallet";
    }

    if (paymentGatewayFilter !== "all") {
      params.paymentGateway = paymentGatewayFilter as "stripe" | "paystack";
    }

    if (currencyFilter !== "all") {
      params.currency = currencyFilter as "NGN" | "GBP" | "USD";
    }

    return params;
  }, [debouncedSearch, statusFilter, paymentMethodFilter, paymentGatewayFilter, currencyFilter, page, limit]);

  // Fetch payments
  const {
    data: paymentsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["payments", queryParams],
    queryFn: () => getPayments(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const payments = useMemo(() => {
    return (paymentsResponse?.data?.payments || []).map((payment) => ({
      ...payment,
      paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined,
      createdAt: new Date(payment.createdAt),
      updatedAt: new Date(payment.updatedAt),
    }));
  }, [paymentsResponse?.data?.payments]);

  // Handle pagination meta (API returns totalDocs instead of total)
  const paginationMeta = useMemo(() => {
    const meta = paymentsResponse?.data?.meta;
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
  }, [paymentsResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading payments",
        description: error instanceof Error ? error.message : "Failed to fetch payments",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  const paymentMethodOptions = [
    { value: "card", label: "Card" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "wallet", label: "Wallet" },
  ];

  const paymentGatewayOptions = [
    { value: "stripe", label: "Stripe" },
    { value: "paystack", label: "Paystack" },
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
        title="Payments"
        description="View and manage all platform payments"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search payments..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Statuses"
        />
        <FilterSelect
          value={paymentMethodFilter}
          onChange={setPaymentMethodFilter}
          placeholder="Payment Method"
          options={paymentMethodOptions}
          allLabel="All Methods"
        />
        <FilterSelect
          value={paymentGatewayFilter}
          onChange={setPaymentGatewayFilter}
          placeholder="Gateway"
          options={paymentGatewayOptions}
          allLabel="All Gateways"
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
        <TableSkeleton columns={8} rows={10} />
      ) : payments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CreditCard className="h-12 w-12" />}
            title="No payments found"
            description={
              search || statusFilter !== "all" || paymentMethodFilter !== "all" || paymentGatewayFilter !== "all" || currencyFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Payments will appear here once transactions are processed"
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
                  <th>User</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <span className="font-mono text-foreground text-sm">
                        {payment.paymentReference}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(payment.metadata?.contactInfo?.name || "??")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {payment.metadata?.contactInfo?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.metadata?.contactInfo?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-muted-foreground capitalize">
                      {payment.paymentType.replace(/_/g, " ")}
                    </td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <span className="capitalize text-foreground text-sm">
                          {payment.paymentMethod.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          via {payment.paymentGateway}
                        </span>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-foreground">
                        {formatPrice(payment.amount, payment.currency)}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={payment.status} />
                    </td>
                    <td>
                      {payment.paidAt ? (
                        <>
                          <p className="text-foreground">{formatDate(payment.paidAt)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(payment.paidAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/payments/${payment.id}`)}
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
                {paginationMeta.total} payments
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
