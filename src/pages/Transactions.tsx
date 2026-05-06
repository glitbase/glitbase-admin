import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Receipt, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Wallet, User, Calendar, Hash, FileText } from "lucide-react";
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
import { getTransactions, type GetTransactionsParams } from "@/services/transactionsApi";
import type { Transaction } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type ExtendedTransaction = Transaction & {
  balanceBefore?: number;
  balanceAfter?: number;
  referenceId?: string;
  metadata?: {
    from?: string;
    to?: string;
    availableBalanceBefore?: number;
    availableBalanceAfter?: number;
  };
};

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [referenceTypeFilter, setReferenceTypeFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<ExtendedTransaction | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
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
    return (transactionsResponse?.data?.transactions || []).map((transaction) => {
      const tx = transaction as ExtendedTransaction;
      return {
        ...tx,
        createdAt: new Date(tx.createdAt),
        updatedAt: new Date(tx.updatedAt),
      };
    });
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
    const actualAmount = price;
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

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case "credit":
        return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "debit":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
      case "transfer":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
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
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                      <span className="font-mono text-foreground text-sm">{transaction.transactionReference}</span>
                      {transaction.referenceNumber && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{transaction.referenceNumber}</p>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className={`font-medium capitalize ${getTypeColor(transaction.type)}`}>{transaction.type}</span>
                      </div>
                    </td>
                    <td>
                      {transaction.vendor ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(transaction.vendor.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">{transaction.vendor.name}</p>
                            <p className="text-xs text-muted-foreground">{transaction.vendor.email}</p>
                          </div>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td>
                      <p className={`font-medium ${getTypeColor(transaction.type)}`}>
                        {transaction.type === "credit" ? "+" : transaction.type === "debit" ? "-" : ""}
                        {formatPrice(transaction.amount, transaction.currency)}
                      </p>
                    </td>
                    <td><span className="text-sm text-foreground capitalize">{transaction.category.replace(/_/g, " ")}</span></td>
                    <td>
                      {transaction.referenceType ? (
                        <span className="text-sm text-foreground capitalize">{transaction.referenceType}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td>
                      <p className="text-sm text-foreground">{formatDate(transaction.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(transaction.createdAt).split(", ")[1]}</p>
                    </td>
                    <td className="text-center">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedTransaction(transaction); setIsSheetOpen(true); }}>
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
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-foreground truncate">{transaction.transactionReference}</p>
                    {transaction.vendor && (
                      <p className="font-medium text-foreground mt-1">{transaction.vendor.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground capitalize">{transaction.category.replace(/_/g, " ")}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedTransaction(transaction); setIsSheetOpen(true); }} className="shrink-0">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex items-center gap-1">
                    {getTypeIcon(transaction.type)}
                    <span className={`text-xs font-medium capitalize ${getTypeColor(transaction.type)}`}>{transaction.type}</span>
                  </div>
                  {transaction.referenceType && (
                    <span className="text-xs text-muted-foreground capitalize">{transaction.referenceType}</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold text-sm ${getTypeColor(transaction.type)}`}>
                    {transaction.type === "credit" ? "+" : transaction.type === "debit" ? "-" : ""}
                    {formatPrice(transaction.amount, transaction.currency)}
                  </span>
                  <span className="text-muted-foreground">{formatDate(transaction.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1}–{Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of {paginationMeta.total} transactions
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

      {/* Transaction Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl h-auto overflow-y-auto m-3 rounded-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Transaction Details
            </SheetTitle>
            <SheetDescription>
              View complete information about the transaction
            </SheetDescription>
          </SheetHeader>

          {selectedTransaction && (
            <div className="space-y-6 py-4">
              {/* Transaction Reference */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Transaction Reference
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Transaction Reference
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-medium text-foreground">
                        {selectedTransaction.transactionReference}
                      </p>
                    </div>
                  </div>
                  {selectedTransaction.referenceNumber && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Reference Number
                      </label>
                      <p className="text-sm font-mono text-foreground">
                        {selectedTransaction.referenceNumber}
                      </p>
                    </div>
                  )}
                  {selectedTransaction.referenceId && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Reference ID
                      </label>
                      <p className="text-sm font-mono text-foreground">
                        {selectedTransaction.referenceId}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Type & Amount */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Transaction Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Type
                    </label>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedTransaction.type)}
                      <Badge className={`capitalize text-xs px-2.5 py-1 border ${getTypeBadgeClass(selectedTransaction.type)}`}>
                        {selectedTransaction.type}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <p className="text-sm text-foreground capitalize">
                      {selectedTransaction.category.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Amount
                    </label>
                    <p className={`text-lg font-bold ${getTypeColor(selectedTransaction.type)}`}>
                      {selectedTransaction.type === "credit" ? "+" : selectedTransaction.type === "debit" ? "-" : ""}
                      {formatPrice(selectedTransaction.amount, selectedTransaction.currency)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Currency
                    </label>
                    <p className="text-sm text-foreground uppercase">
                      {selectedTransaction.currency}
                    </p>
                  </div>

                  {selectedTransaction.balanceBefore !== undefined && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Balance Before
                      </label>
                      <p className="text-sm text-foreground">
                        {formatPrice(selectedTransaction.balanceBefore, selectedTransaction.currency)}
                      </p>
                    </div>
                  )}

                  {selectedTransaction.balanceAfter !== undefined && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Balance After
                      </label>
                      <p className="text-sm text-foreground">
                        {formatPrice(selectedTransaction.balanceAfter, selectedTransaction.currency)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedTransaction.description && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Description
                  </h3>
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-foreground leading-relaxed">
                      {selectedTransaction.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Reference Information */}
              {selectedTransaction.referenceType && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Reference Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Reference Type
                      </label>
                      <p className="text-sm text-foreground capitalize">
                        {selectedTransaction.referenceType}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Information */}
              {selectedTransaction.wallet && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Wallet Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Wallet ID
                      </label>
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-mono text-foreground">
                          {selectedTransaction.wallet.id}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Currency
                      </label>
                      <p className="text-sm text-foreground uppercase">
                        {selectedTransaction.wallet.currency}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Vendor ID
                      </label>
                      <p className="text-sm font-mono text-foreground">
                        {selectedTransaction.wallet.vendor}
                      </p>
                    </div>

                    {selectedTransaction.wallet.pendingBalance !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Pending Balance
                        </label>
                        <p className="text-sm text-foreground">
                          {formatPrice(selectedTransaction.wallet.pendingBalance, selectedTransaction.wallet.currency)}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.wallet.availableBalance !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Available Balance
                        </label>
                        <p className="text-sm text-foreground">
                          {formatPrice(selectedTransaction.wallet.availableBalance, selectedTransaction.wallet.currency)}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.wallet.totalLifetimeEarnings !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Total Lifetime Earnings
                        </label>
                        <p className="text-sm text-foreground">
                          {formatPrice(selectedTransaction.wallet.totalLifetimeEarnings, selectedTransaction.wallet.currency)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vendor Information */}
              {selectedTransaction.vendor && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Vendor Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Vendor ID
                      </label>
                      <p className="text-sm font-mono text-foreground">
                        {selectedTransaction.vendor.id}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Name
                      </label>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">
                          {selectedTransaction.vendor.name}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Email
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedTransaction.vendor.email}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedTransaction.metadata && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTransaction.metadata.from && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          From
                        </label>
                        <p className="text-sm text-foreground capitalize">
                          {selectedTransaction.metadata.from}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.metadata.to && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          To
                        </label>
                        <p className="text-sm text-foreground capitalize">
                          {selectedTransaction.metadata.to}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.metadata.availableBalanceBefore !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Available Balance Before
                        </label>
                        <p className="text-sm text-foreground">
                          {formatPrice(selectedTransaction.metadata.availableBalanceBefore, selectedTransaction.currency)}
                        </p>
                      </div>
                    )}

                    {selectedTransaction.metadata.availableBalanceAfter !== undefined && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Available Balance After
                        </label>
                        <p className="text-sm text-foreground">
                          {formatPrice(selectedTransaction.metadata.availableBalanceAfter, selectedTransaction.currency)}
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
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedTransaction.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedTransaction.createdAt).split(", ")[1]}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Updated At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedTransaction.updatedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedTransaction.updatedAt).split(", ")[1]}
                        </p>
                      </div>
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

