import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, Receipt, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getTransactions, type GetTransactionsParams } from "@/services/transactionsApi";
import type { Transaction } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<string>("all");
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
  }, [typeFilter, categoryFilter, referenceTypeFilter, currencyFilter]);

  // Build query params
  const queryParams: GetTransactionsParams = useMemo(() => {
    const params: GetTransactionsParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (typeFilter !== "all") {
      params.type = typeFilter as "credit" | "debit" | "transfer";
    }

    if (categoryFilter !== "all") {
      params.category = categoryFilter;
    }

    if (referenceTypeFilter !== "all") {
      params.referenceType = referenceTypeFilter as "booking" | "payment" | "payout";
    }

    if (currencyFilter !== "all") {
      params.currency = currencyFilter as "NGN" | "GBP" | "USD";
    }

    return params;
  }, [debouncedSearch, typeFilter, categoryFilter, referenceTypeFilter, currencyFilter, page, limit]);

  // Fetch transactions
  const {
    data: transactionsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["transactions", queryParams],
    queryFn: () => getTransactions(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const transactions = useMemo(() => {
    return (transactionsResponse?.data?.transactions || []).map((transaction) => ({
      ...transaction,
      createdAt: new Date(transaction.createdAt),
      updatedAt: new Date(transaction.updatedAt),
    }));
  }, [transactionsResponse?.data?.transactions]);

  // Handle pagination meta
  const paginationMeta = useMemo(() => {
    const meta = transactionsResponse?.data?.meta;
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
  }, [transactionsResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading transactions",
        description: error instanceof Error ? error.message : "Failed to fetch transactions",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const typeOptions = [
    { value: "credit", label: "Credit" },
    { value: "debit", label: "Debit" },
    { value: "transfer", label: "Transfer" },
  ];

  const referenceTypeOptions = [
    { value: "booking", label: "Booking" },
    { value: "payment", label: "Payment" },
    { value: "payout", label: "Payout" },
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
    // Amount is in lowest unit (cents/pence/kobo), divide by 100
    const actualAmount = price / 100;
    const currencyUpper = currency.toUpperCase();
    return `${symbols[currencyUpper] || currencyUpper}${actualAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "credit":
        return <ArrowDownCircle className="h-4 w-4 text-green-600" />;
      case "debit":
        return <ArrowUpCircle className="h-4 w-4 text-red-600" />;
      case "transfer":
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "credit":
        return "text-green-600";
      case "debit":
        return "text-red-600";
      case "transfer":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Transactions"
        description="View all wallet transactions across the platform"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search transactions..."
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="Type"
          options={typeOptions}
          allLabel="All Types"
        />
        <FilterSelect
          value={referenceTypeFilter}
          onChange={setReferenceTypeFilter}
          placeholder="Reference Type"
          options={referenceTypeOptions}
          allLabel="All Reference Types"
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
      ) : transactions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Receipt className="h-12 w-12" />}
            title="No transactions found"
            description={
              search || typeFilter !== "all" || referenceTypeFilter !== "all" || currencyFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Transactions will appear here once they are created"
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
                  <th>Type</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Reference Type</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <span className="font-mono text-foreground text-sm">
                        {transaction.transactionReference}
                      </span>
                      {transaction.referenceNumber && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {transaction.referenceNumber}
                        </p>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className={`font-medium capitalize ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td>
                      {transaction.vendor ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(transaction.vendor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {transaction.vendor.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.vendor.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      <p className={`font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type === "credit" ? "+" : transaction.type === "debit" ? "-" : ""}
                        {formatPrice(transaction.amount, transaction.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {transaction.currency}
                      </p>
                    </td>
                    <td>
                      <span className="text-sm text-foreground capitalize">
                        {transaction.category.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {transaction.referenceType ? (
                        <span className="text-sm text-foreground capitalize">
                          {transaction.referenceType}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-foreground">
                        {formatDate(transaction.createdAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(transaction.createdAt).split(", ")[1]}
                      </p>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/transactions/${transaction.id}`)}
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
                {paginationMeta.total} transactions
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

