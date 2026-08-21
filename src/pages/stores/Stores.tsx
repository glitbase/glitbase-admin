import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Eye, Store as StoreIcon, MapPin, Star, Check, X, Ban } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  EmptyState,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoreDetailSheet } from "@/components/stores/StoreDetailSheet";
import {
  getAdminStores,
  approveStore,
  rejectStore,
  type GetAdminStoresParams,
} from "@/services/storesApi";
import type { Store } from "@/types/api";
import {
  getStoreOwnerName,
  getStoreVisibility,
  normalizeStoreFromApi,
} from "@/lib/storeUtils";
import { useToast } from "@/hooks/use-toast";

type VisibilityFilter = "pending" | "published" | "all";
type RejectDialogMode = "reject" | "suspend";

export default function StoresPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [rejectingStore, setRejectingStore] = useState<Store | null>(null);
  const [rejectDialogMode, setRejectDialogMode] = useState<RejectDialogMode>("reject");
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvingStore, setApprovingStore] = useState<Store | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [visibilityFilter]);

  const queryParams: GetAdminStoresParams = useMemo(() => {
    const params: GetAdminStoresParams = { page, limit };
    if (visibilityFilter === "pending") params.isPublic = false;
    if (visibilityFilter === "published") params.isPublic = true;
    return params;
  }, [visibilityFilter, page, limit]);

  const {
    data: storesResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin-stores", queryParams],
    queryFn: () => getAdminStores(queryParams),
    retry: 1,
  });

  const stores = useMemo(() => {
    const rows = (storesResponse?.data?.stores || []).map((store) =>
      normalizeStoreFromApi(store as Store & { _id?: string })
    );

    if (!debouncedSearch.trim()) return rows;

    const term = debouncedSearch.toLowerCase();
    return rows.filter((store) => {
      const ownerName = getStoreOwnerName(store.owner).toLowerCase();
      return (
        store.name.toLowerCase().includes(term) ||
        ownerName.includes(term) ||
        store.owner?.email?.toLowerCase().includes(term)
      );
    });
  }, [storesResponse?.data?.stores, debouncedSearch]);

  const paginationMeta = storesResponse?.data?.meta;

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading stores",
        description: error instanceof Error ? error.message : "Failed to fetch stores",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const approveMutation = useMutation({
    mutationFn: approveStore,
    onSuccess: () => {
      toast({
        title: "Store approved",
        description: "The store is now visible on the marketplace.",
        variant: "success",
      });
      setApprovingStore(null);
      setViewingStore(null);
      queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
      queryClient.invalidateQueries({ queryKey: ["store-detail"] });
    },
    onError: (err: Error) => {
      toast({ title: "Approval failed", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ storeId, reason }: { storeId: string; reason: string }) =>
      rejectStore(storeId, reason),
    onSuccess: (_data, variables) => {
      const wasSuspend = rejectDialogMode === "suspend";
      toast({
        title: wasSuspend ? "Store suspended" : "Store rejected",
        description: wasSuspend
          ? "The store has been hidden from the marketplace."
          : "The vendor has been notified.",
        variant: "success",
      });
      setRejectingStore(null);
      setRejectionReason("");
      setRejectDialogMode("reject");
      setViewingStore(null);
      queryClient.invalidateQueries({ queryKey: ["admin-stores"] });
      queryClient.invalidateQueries({ queryKey: ["store-detail", variables.storeId] });
    },
    onError: (err: Error) => {
      const title = rejectDialogMode === "suspend" ? "Suspension failed" : "Rejection failed";
      toast({ title, description: err.message, variant: "destructive" });
    },
  });

  const openRejectDialog = (store: Store, mode: RejectDialogMode) => {
    setRejectDialogMode(mode);
    setRejectingStore(store);
    setRejectionReason(mode === "suspend" ? "" : (store.rejectionReason ?? ""));
  };

  const handleRejectSubmit = () => {
    if (!rejectingStore) return;
    if (!rejectionReason.trim()) {
      toast({
        title: "Validation",
        description:
          rejectDialogMode === "suspend"
            ? "A suspension reason is required"
            : "A rejection reason is required",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ storeId: rejectingStore.id, reason: rejectionReason.trim() });
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const visibilityOptions = [
    { value: "pending", label: "Pending review" },
    { value: "published", label: "Published" },
    { value: "all", label: "All stores" },
  ];

  const emptyDescription =
    visibilityFilter === "pending"
      ? "No stores are waiting for review"
      : visibilityFilter === "published"
        ? "No published stores found"
        : "Try adjusting your search or filters";

  const renderStoreActions = (store: Store) => {
    const visibility = getStoreVisibility(store);

    return (
      <>
        <DropdownMenuItem
          onClick={() => setViewingStore(store)}
          className="cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-2" />
          View details
        </DropdownMenuItem>

        {visibility === "pending" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setApprovingStore(store)}
              className="cursor-pointer"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openRejectDialog(store, "reject")}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </DropdownMenuItem>
          </>
        )}

        {visibility === "published" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => openRejectDialog(store, "suspend")}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </DropdownMenuItem>
          </>
        )}

        {visibility === "rejected" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setApprovingStore(store)}
              className="cursor-pointer"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </DropdownMenuItem>
          </>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Stores"
        description="Review vendor stores before they appear on the marketplace"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search stores or owners..."
        />
        <FilterSelect
          value={visibilityFilter}
          onChange={(v) => setVisibilityFilter(v as VisibilityFilter)}
          placeholder="Visibility"
          options={visibilityOptions}
          showAll={false}
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={9} rows={10} />
      ) : stores.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No stores found"
            description={emptyDescription}
            icon={<StoreIcon className="h-6 w-6" />}
          />
        </div>
      ) : (
        <div className="card">
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Owner</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Rating</th>
                  <th>Visibility</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {store.bannerImageUrl ? (
                          <img
                            src={store.bannerImageUrl}
                            alt={store.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <StoreIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground">{store.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {store.description || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-foreground">{getStoreOwnerName(store.owner)}</p>
                      <p className="text-xs text-muted-foreground">{store.owner?.email}</p>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {store.type?.length ? (
                          store.type.map((type) => (
                            <span
                              key={type}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-primary/10 text-primary"
                            >
                              {type}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {store.location ? (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span>
                            {store.location.city}, {store.location.state}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      {store.rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning text-warning" />
                          <span className="font-medium text-foreground">
                            {store.rating.toFixed(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({store.reviewCount ?? 0})
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No reviews</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={getStoreVisibility(store)} />
                    </td>
                    <td>
                      <StatusBadge status={store.status} />
                    </td>
                    <td className="text-muted-foreground">{formatDate(store.createdAt)}</td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {renderStoreActions(store)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border">
            {stores.map((store) => (
              <div key={store.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {store.bannerImageUrl ? (
                      <img
                        src={store.bannerImageUrl}
                        alt={store.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <StoreIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{store.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getStoreOwnerName(store.owner)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">{renderStoreActions(store)}</DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={getStoreVisibility(store)} />
                  <StatusBadge status={store.status} />
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(store.createdAt)}</p>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing{" "}
                {(paginationMeta.page - 1) * paginationMeta.limit + 1}–
                {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                {paginationMeta.total} stores
              </div>
              <div className="pagination-controls">
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

      <StoreDetailSheet
        open={Boolean(viewingStore)}
        onOpenChange={(open) => !open && setViewingStore(null)}
        store={viewingStore}
        onApprove={(store) => setApprovingStore(store)}
        onReject={(store) => openRejectDialog(store, "reject")}
        onSuspend={(store) => openRejectDialog(store, "suspend")}
      />

      <Dialog open={Boolean(approvingStore)} onOpenChange={(open) => !open && setApprovingStore(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve store?</DialogTitle>
            <DialogDescription>
              <strong>{approvingStore?.name}</strong> will become visible on the marketplace.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApprovingStore(null)}>
              Cancel
            </Button>
            <Button
              disabled={approveMutation.isPending}
              onClick={() => approvingStore && approveMutation.mutate(approvingStore.id)}
            >
              {approveMutation.isPending ? "Approving…" : "Approve store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(rejectingStore)}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingStore(null);
            setRejectionReason("");
            setRejectDialogMode("reject");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {rejectDialogMode === "suspend" ? "Suspend store" : "Reject store"}
            </DialogTitle>
            <DialogDescription>
              {rejectDialogMode === "suspend" ? (
                <>
                  <strong>{rejectingStore?.name}</strong> will be hidden from the marketplace. The
                  vendor will be notified.
                </>
              ) : (
                <>
                  Provide a reason for rejecting <strong>{rejectingStore?.name}</strong>. The
                  vendor will be notified.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="store-rejection-reason">
              {rejectDialogMode === "suspend" ? "Suspension reason" : "Rejection reason"}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="store-rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={
                rejectDialogMode === "suspend"
                  ? "e.g. Policy violation — store temporarily suspended"
                  : "e.g. Incomplete store profile"
              }
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectingStore(null);
                setRejectionReason("");
                setRejectDialogMode("reject");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={handleRejectSubmit}
            >
              {rejectMutation.isPending
                ? rejectDialogMode === "suspend"
                  ? "Suspending…"
                  : "Rejecting…"
                : rejectDialogMode === "suspend"
                  ? "Suspend store"
                  : "Reject store"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
