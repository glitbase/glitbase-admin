import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Crown, Calendar, CheckCircle2, XCircle, Plus, Edit, Trash2 } from "lucide-react";
import {
  PageHeader,
  FilterSelect,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
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
import { getSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan, type GetSubscriptionPlansParams, type CreateSubscriptionPlanPayload, type UpdateSubscriptionPlanPayload } from "@/services/subscriptionPlansApi";
import type { SubscriptionPlan } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const { toast } = useToast();
  
  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateSubscriptionPlanPayload>({
    name: "",
    type: "monthly",
    price: 0,
    currency: "GBP",
    description: "",
    durationInMonths: 1,
    isActive: true,
    stripePriceId: "",
  });
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateSubscriptionPlanPayload>({});
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(null);

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
      id: plan.id || (plan as any)._id, // Handle both id and _id
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

  // Create plan mutation
  const createMutation = useMutation({
    mutationFn: createSubscriptionPlan,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
        variant: "success",
      });
      setIsCreateDialogOpen(false);
      setFormData({
        name: "",
        type: "monthly",
        price: 0,
        currency: "GBP",
        description: "",
        durationInMonths: 1,
        isActive: true,
        stripePriceId: "",
      });
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update plan mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubscriptionPlanPayload }) =>
      updateSubscriptionPlan(id, payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
        variant: "success",
      });
      setIsEditDialogOpen(false);
      setEditingPlan(null);
      setEditFormData({});
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete plan mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSubscriptionPlan,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
        variant: "success",
      });
      setIsDeleteDialogOpen(false);
      setDeletingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Plan name is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.stripePriceId.trim()) {
      toast({
        title: "Validation Error",
        description: "Stripe Price ID is required",
        variant: "destructive",
      });
      return;
    }
    if (formData.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Price must be greater than 0",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  // Handle edit form submission
  const handleEditSubmit = () => {
    if (!editingPlan) return;

    const payload: UpdateSubscriptionPlanPayload = {};
    
    if (editFormData.name !== undefined && editFormData.name.trim() !== editingPlan.name) {
      payload.name = editFormData.name.trim();
    }
    if (editFormData.price !== undefined && editFormData.price !== editingPlan.price) {
      payload.price = editFormData.price;
    }
    if (editFormData.description !== undefined && editFormData.description.trim() !== (editingPlan.description || "")) {
      payload.description = editFormData.description.trim();
    }
    if (editFormData.isActive !== undefined && editFormData.isActive !== editingPlan.isActive) {
      payload.isActive = editFormData.isActive;
    }
    if (editFormData.stripePriceId !== undefined && editFormData.stripePriceId.trim() !== editingPlan.stripePriceId) {
      payload.stripePriceId = editFormData.stripePriceId.trim();
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: "No Changes",
        description: "No changes were made to the plan",
      });
      return;
    }

    updateMutation.mutate({ id: editingPlan.id, payload });
  };

  // Open edit dialog
  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setEditFormData({
      name: plan.name,
      price: plan.price,
      description: plan.description || "",
      isActive: plan.isActive,
      stripePriceId: plan.stripePriceId,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setDeletingPlan(plan);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (deletingPlan) {
      deleteMutation.mutate(deletingPlan.id);
    }
  };

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
        <Button onClick={() => setIsCreateDialogOpen(true)} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(plan)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(plan)}
                            className="text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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

      {/* Create Plan Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>
              Add a new subscription plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Plan Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monthly Plan"
              />
            </div>

            {/* Type and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "monthly" | "yearly") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">
                  Currency <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="NGN">NGN (₦)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">
                  Price (in lowest unit) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="tel"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 1200 (for £12.00)"
                />
                <p className="text-xs text-muted-foreground">
                  Enter amount in cents/pence (e.g., 1200 = £12.00)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration (months) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationInMonths}
                  onChange={(e) => setFormData({ ...formData, durationInMonths: parseInt(e.target.value) || 1 })}
                  placeholder="e.g., 1"
                />
              </div>
            </div>

            {/* Stripe Price ID */}
            <div className="space-y-2">
              <Label htmlFor="stripePriceId">
                Stripe Price ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="stripePriceId"
                value={formData.stripePriceId}
                onChange={(e) => setFormData({ ...formData, stripePriceId: e.target.value })}
                placeholder="e.g., price_1SL2TsBd49G0pgvWPyyZxRrr"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description (optional)"
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Make this plan available for subscription
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>
              Update plan information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Monthly Plan"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (in lowest unit)</Label>
              <Input
                id="edit-price"
                type="tel"
                value={editFormData.price || ""}
                onChange={(e) => setEditFormData({ ...editFormData, price: parseInt(e.target.value) || 0 })}
                placeholder="e.g., 1200 (for £12.00)"
              />
              <p className="text-xs text-muted-foreground">
                Enter amount in cents/pence (e.g., 1200 = £12.00)
              </p>
            </div>

            {/* Stripe Price ID */}
            <div className="space-y-2">
              <Label htmlFor="edit-stripePriceId">Stripe Price ID</Label>
              <Input
                id="edit-stripePriceId"
                value={editFormData.stripePriceId || ""}
                onChange={(e) => setEditFormData({ ...editFormData, stripePriceId: e.target.value })}
                placeholder="e.g., price_1SL2TsBd49G0pgvWPyyZxRrr"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description || ""}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Plan description (optional)"
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="edit-isActive">Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Make this plan available for subscription
                </p>
              </div>
              <Switch
                id="edit-isActive"
                checked={editFormData.isActive ?? true}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the plan "{deletingPlan?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
