import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, Crown, Calendar, CheckCircle2, XCircle } from "lucide-react";
import {
  PageHeader,
  FilterSelect,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getSubscriptionPlans, type GetSubscriptionPlansParams } from "@/services/subscriptionPlansApi";
import type { SubscriptionPlan } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const { toast } = useToast();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  // Build query params
  const queryParams: GetSubscriptionPlansParams = useMemo(() => {
    const params: GetSubscriptionPlansParams = {
      page,
      limit,
    };

    if (typeFilter !== "all") {
      params.type = typeFilter as "monthly" | "yearly";
    }

    if (statusFilter !== "all") {
      params.isActive = statusFilter === "active";
    }

    return params;
  }, [typeFilter, statusFilter, page, limit]);

  // Fetch plans
  const {
    data: plansResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["subscription-plans", queryParams],
    queryFn: () => getSubscriptionPlans(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const plans = useMemo(() => {
    return (plansResponse?.data?.plans || []).map((plan) => ({
      ...plan,
      createdAt: new Date(plan.createdAt),
      updatedAt: new Date(plan.updatedAt),
    }));
  }, [plansResponse?.data?.plans]);

  // Handle pagination meta
  const paginationMeta = useMemo(() => {
    const meta = plansResponse?.data?.meta;
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
  }, [plansResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading plans",
        description: error instanceof Error ? error.message : "Failed to fetch subscription plans",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const typeOptions = [
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Subscription Plans"
        description="Manage subscription plans and pricing"
      />

      <div className="filter-bar">
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="Plan Type"
          options={typeOptions}
          allLabel="All Types"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Statuses"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} rows={10} />
      ) : plans.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Crown className="h-12 w-12" />}
            title="No plans found"
            description={
              typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Subscription plans will appear here once they are created"
            }
          />
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plan Name</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        <p className="font-medium text-foreground">{plan.name}</p>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {plan.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground capitalize">
                          {plan.type}
                        </span>
                      </div>
                    </td>
                    <td>
                      <p className="font-medium text-foreground">
                        {formatPrice(plan.price, plan.currency)}
                      </p>
                    </td>
                    <td>
                      <span className="text-sm text-foreground">
                        {plan.durationInMonths} {plan.durationInMonths === 1 ? "month" : "months"}
                      </span>
                    </td>
                    <td>
                      {plan.isActive ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Inactive</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-foreground">{formatDate(plan.createdAt)}</p>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/categories/subscription-plans/${plan.id}`)}
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
                {paginationMeta.total} plans
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
