import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, Crown } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getSubscriptions, type GetSubscriptionsParams } from "@/services/subscriptionsApi";
import type { Subscription } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SubscriptionsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionTypeFilter, setSubscriptionTypeFilter] = useState<string>("all");
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
  }, [statusFilter, subscriptionTypeFilter, currencyFilter]);

  // Build query params
  const queryParams: GetSubscriptionsParams = useMemo(() => {
    const params: GetSubscriptionsParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter as "active" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "trialing" | "unpaid";
    }

    if (subscriptionTypeFilter !== "all") {
      params.subscriptionType = subscriptionTypeFilter as "monthly" | "yearly";
    }

    if (currencyFilter !== "all") {
      params.currency = currencyFilter as "NGN" | "GBP" | "USD";
    }

    return params;
  }, [debouncedSearch, statusFilter, subscriptionTypeFilter, currencyFilter, page, limit]);

  // Fetch subscriptions
  const {
    data: subscriptionsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["subscriptions", queryParams],
    queryFn: () => getSubscriptions(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const subscriptions = useMemo(() => {
    return (subscriptionsResponse?.data?.subscriptions || []).map((subscription) => ({
      ...subscription,
      currentPeriodStart: new Date(subscription.currentPeriodStart),
      currentPeriodEnd: new Date(subscription.currentPeriodEnd),
      canceledAt: subscription.canceledAt ? new Date(subscription.canceledAt) : undefined,
      createdAt: new Date(subscription.createdAt),
      updatedAt: new Date(subscription.updatedAt),
    }));
  }, [subscriptionsResponse?.data?.subscriptions]);

  // Handle pagination meta (API returns totalDocs instead of total)
  const paginationMeta = useMemo(() => {
    const meta = subscriptionsResponse?.data?.meta;
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
  }, [subscriptionsResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading subscriptions",
        description: error instanceof Error ? error.message : "Failed to fetch subscriptions",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "past_due", label: "Past Due" },
    { value: "canceled", label: "Canceled" },
    { value: "incomplete", label: "Incomplete" },
    { value: "incomplete_expired", label: "Incomplete Expired" },
    { value: "trialing", label: "Trialing" },
    { value: "unpaid", label: "Unpaid" },
  ];

  const subscriptionTypeOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
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

  const getInitials = (name: string) => {
    if (!name) return "??";
    const names = name.trim().split(" ");
    return names.map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Subscriptions"
        description="Manage subscription plans and vendor subscriptions"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search subscriptions..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Statuses"
        />
        <FilterSelect
          value={subscriptionTypeFilter}
          onChange={setSubscriptionTypeFilter}
          placeholder="Type"
          options={subscriptionTypeOptions}
          allLabel="All Types"
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
      ) : subscriptions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Crown className="h-12 w-12" />}
            title="No subscriptions found"
            description={
              search || statusFilter !== "all" || subscriptionTypeFilter !== "all" || currencyFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Subscriptions will appear here once vendors subscribe to plans"
            }
          />
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Period</th>
                  <th>Renews</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(subscription.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {subscription.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {subscription.user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-foreground">
                        {subscription.plan.name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {subscription.subscriptionType === "monthly" ? "Monthly" : subscription.subscriptionType === "yearly" ? "Yearly" : subscription.subscriptionType}
                      </p>
                    </td>
                    <td>
                      <p className="font-medium text-foreground">
                        {formatPrice(subscription.amount, subscription.currency.toUpperCase())}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        per {subscription.subscriptionType === "monthly" ? "month" : subscription.subscriptionType === "yearly" ? "year" : subscription.subscriptionType}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={subscription.status} />
                    </td>
                    <td>
                      <p className="text-sm text-foreground">
                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </td>
                    <td>
                      {subscription.cancelAtPeriodEnd ? (
                        <span className="text-sm text-muted-foreground">Cancels at period end</span>
                      ) : (
                        <span className="text-sm text-foreground">{formatDate(subscription.currentPeriodEnd)}</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/subscriptions/${subscription.id}`)}
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
                {paginationMeta.total} subscriptions
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

