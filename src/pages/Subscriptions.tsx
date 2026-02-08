import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Crown, Calendar, User, CreditCard, Hash } from "lucide-react";
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
import { getSubscriptions, type GetSubscriptionsParams } from "@/services/subscriptionsApi";
import type { Subscription } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionTypeFilter, setSubscriptionTypeFilter] = useState<string>("all");
  const [currencyFilter, setCurrencyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
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
                        onClick={() => {
                          setSelectedSubscription(subscription);
                          setIsSheetOpen(true);
                        }}
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

      {/* Subscription Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl h-auto overflow-y-auto m-3 rounded-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              Subscription Details
            </SheetTitle>
            <SheetDescription>
              View complete information about the subscription
            </SheetDescription>
          </SheetHeader>

          {selectedSubscription && (
            <div className="space-y-6 py-4">
              {/* Subscription ID */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Subscription Reference
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Subscription ID
                    </label>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-mono font-medium text-foreground">
                        {selectedSubscription.id}
                      </p>
                    </div>
                  </div>
                  {selectedSubscription.stripeSubscriptionId && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Stripe Subscription ID
                      </label>
                      <p className="text-sm font-mono text-foreground">
                        {selectedSubscription.stripeSubscriptionId}
                      </p>
                    </div>
                  )}
                  {selectedSubscription.stripeCustomerId && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Stripe Customer ID
                      </label>
                      <p className="text-sm font-mono text-foreground">
                        {selectedSubscription.stripeCustomerId}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* User Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  User Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      User ID
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedSubscription.userId}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Name
                    </label>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground capitalize">
                        {selectedSubscription.user.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <p className="text-sm text-foreground">
                      {selectedSubscription.user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Plan Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Plan ID
                    </label>
                    <p className="text-sm font-mono text-foreground">
                      {selectedSubscription.planId}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Plan Name
                    </label>
                    <p className="text-sm font-medium text-foreground">
                      {selectedSubscription.plan.name}
                    </p>
                  </div>

                  {selectedSubscription.plan.description && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Description
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedSubscription.plan.description}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Subscription Type
                    </label>
                    <Badge className="capitalize text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/20">
                      {selectedSubscription.subscriptionType === "monthly" ? "Monthly" : selectedSubscription.subscriptionType === "yearly" ? "Yearly" : selectedSubscription.subscriptionType}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Status
                    </label>
                    <div>
                      <StatusBadge status={selectedSubscription.status} />
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
                      Amount
                    </label>
                    <p className="text-lg font-bold text-foreground">
                      {formatPrice(selectedSubscription.amount, selectedSubscription.currency.toUpperCase())}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Currency
                    </label>
                    <p className="text-sm text-foreground uppercase">
                      {selectedSubscription.currency}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Plan Price
                    </label>
                    <p className="text-sm text-foreground">
                      {formatPrice(selectedSubscription.plan.price, selectedSubscription.plan.currency)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Plan Currency
                    </label>
                    <p className="text-sm text-foreground uppercase">
                      {selectedSubscription.plan.currency}
                    </p>
                  </div>
                </div>
              </div>

              {/* Period Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Period Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Current Period Start
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedSubscription.currentPeriodStart)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedSubscription.currentPeriodStart).split(", ")[1]}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Current Period End
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedSubscription.currentPeriodEnd)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedSubscription.currentPeriodEnd).split(", ")[1]}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Cancel at Period End
                    </label>
                    <div className="flex items-center gap-2">
                      {selectedSubscription.cancelAtPeriodEnd ? (
                        <Badge variant="destructive" className="text-xs">
                          Yes - Will cancel at period end
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          No - Will auto-renew
                        </Badge>
                      )}
                    </div>
                  </div>

                  {selectedSubscription.canceledAt && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Canceled At
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-foreground">
                            {formatDate(selectedSubscription.canceledAt)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(selectedSubscription.canceledAt).split(", ")[1]}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

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
                          {formatDate(selectedSubscription.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedSubscription.createdAt).split(", ")[1]}
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
                          {formatDate(selectedSubscription.updatedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedSubscription.updatedAt).split(", ")[1]}
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

