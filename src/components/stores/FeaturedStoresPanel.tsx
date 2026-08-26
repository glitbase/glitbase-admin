import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  Plus,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  FilterSelect,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getFeaturedStores,
  updateFeaturedStore,
  deleteFeaturedStore,
  reorderFeaturedStores,
  type GetFeaturedStoresParams,
  type UpdateFeaturedStorePayload,
} from "@/services/featuredStoresApi";
import type { FeaturedStoreEntry, FeaturedStorePlacement } from "@/types/api";
import { CreateFeaturedStoreSheet } from "@/components/stores/CreateFeaturedStoreSheet";
import { useToast } from "@/hooks/use-toast";

const PLACEMENT_OPTIONS = [
  { value: "marketplace", label: "Marketplace" },
  { value: "homepage", label: "Homepage" },
];

const ACTIVE_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

function normalizeFeaturedStore(raw: FeaturedStoreEntry & { _id?: string }): FeaturedStoreEntry {
  const storeRaw = raw.store as FeaturedStoreEntry["store"] & { _id?: string };
  return {
    ...raw,
    id: raw.id || raw._id || "",
    store: {
      ...storeRaw,
      id: storeRaw?.id || storeRaw?._id || "",
    },
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    startsAt: raw.startsAt ? new Date(raw.startsAt) : undefined,
    endsAt: raw.endsAt ? new Date(raw.endsAt) : undefined,
  };
}

function getFeaturedByName(featuredBy: FeaturedStoreEntry["featuredBy"]) {
  if (typeof featuredBy === "string") return featuredBy;
  const full = `${featuredBy.firstName ?? ""} ${featuredBy.lastName ?? ""}`.trim();
  return full || featuredBy.email;
}

function formatPlacement(placement: FeaturedStorePlacement) {
  return placement === "marketplace" ? "Marketplace" : "Homepage";
}

export function FeaturedStoresPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [placementFilter, setPlacementFilter] = useState("marketplace");
  const [activeFilter, setActiveFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FeaturedStoreEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<FeaturedStoreEntry | null>(null);
  const [editForm, setEditForm] = useState<UpdateFeaturedStorePayload>({});

  const queryParams: GetFeaturedStoresParams = useMemo(() => {
    const params: GetFeaturedStoresParams = { page: 1, limit: 100 };
    if (placementFilter !== "all") {
      params.placement = placementFilter as FeaturedStorePlacement;
    }
    if (activeFilter === "true") params.isActive = true;
    if (activeFilter === "false") params.isActive = false;
    return params;
  }, [placementFilter, activeFilter]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["featured-stores", queryParams],
    queryFn: () => getFeaturedStores(queryParams),
    retry: 1,
  });

  const featuredStores = useMemo(() => {
    return (data?.data?.featuredStores || [])
      .map((entry) => normalizeFeaturedStore(entry as FeaturedStoreEntry & { _id?: string }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [data?.data?.featuredStores]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading featured stores",
        description: error instanceof Error ? error.message : "Failed to fetch featured stores",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["featured-stores"] });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFeaturedStorePayload }) =>
      updateFeaturedStore(id, payload),
    onSuccess: () => {
      toast({ title: "Featured store updated", variant: "success" });
      setEditingEntry(null);
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFeaturedStore,
    onSuccess: () => {
      toast({ title: "Featured store removed", variant: "success" });
      setDeletingEntry(null);
      invalidate();
    },
    onError: (err: Error) => {
      toast({ title: "Remove failed", description: err.message, variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderFeaturedStores,
    onSuccess: () => invalidate(),
    onError: (err: Error) => {
      toast({ title: "Reorder failed", description: err.message, variant: "destructive" });
    },
  });

  const toggleActive = (entry: FeaturedStoreEntry) => {
    updateMutation.mutate({ id: entry.id, payload: { isActive: !entry.isActive } });
  };

  const moveEntry = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= featuredStores.length) return;

    const reordered = [...featuredStores];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    reorderMutation.mutate({
      featuredStoreIds: reordered.map((entry) => entry.id),
    });
  };

  const openEdit = (entry: FeaturedStoreEntry) => {
    setEditingEntry(entry);
    setEditForm({
      placement: entry.placement,
      displayOrder: entry.displayOrder,
      isActive: entry.isActive,
      note: entry.note ?? "",
    });
  };

  const handleEditSubmit = () => {
    if (!editingEntry) return;
    const payload: UpdateFeaturedStorePayload = {
      placement: editForm.placement,
      displayOrder: editForm.displayOrder,
      isActive: editForm.isActive,
      note: editForm.note?.trim() || undefined,
    };
    updateMutation.mutate({ id: editingEntry.id, payload });
  };

  const canReorder = placementFilter !== "all" && featuredStores.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Manage spotlight stores shown on the marketplace and homepage.
        </p>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          Feature store
        </Button>
      </div>

      <div className="filter-bar flex-wrap">
        <FilterSelect
          value={placementFilter}
          onChange={setPlacementFilter}
          placeholder="Placement"
          options={PLACEMENT_OPTIONS}
          allLabel="All placements"
        />
        <FilterSelect
          value={activeFilter}
          onChange={setActiveFilter}
          placeholder="Status"
          options={ACTIVE_OPTIONS}
          allLabel="All statuses"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} rows={6} />
      ) : featuredStores.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No featured stores"
            description="Feature a published store to spotlight it on the marketplace"
            icon={<Star className="h-6 w-6" />}
          />
        </div>
      ) : (
        <div className="card">
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-[60px]">Order</th>
                  <th>Store</th>
                  <th>Placement</th>
                  <th>Status</th>
                  <th>Note</th>
                  <th>Featured by</th>
                  <th className="w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {featuredStores.map((entry, index) => (
                  <tr key={entry.id}>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium w-6">{entry.displayOrder}</span>
                        {canReorder && (
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={index === 0 || reorderMutation.isPending}
                              onClick={() => moveEntry(index, "up")}
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={
                                index === featuredStores.length - 1 || reorderMutation.isPending
                              }
                              onClick={() => moveEntry(index, "down")}
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        {entry.store?.bannerImageUrl ? (
                          <img
                            src={entry.store.bannerImageUrl}
                            alt={entry.store.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Star className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{entry.store?.name || "—"}</p>
                          {entry.store?.location && (
                            <p className="text-xs text-muted-foreground">
                              {entry.store.location.city}, {entry.store.location.state}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm capitalize">{formatPlacement(entry.placement)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={entry.isActive}
                          onCheckedChange={() => toggleActive(entry)}
                          disabled={updateMutation.isPending}
                        />
                        <StatusBadge status={entry.isActive ? "active" : "inactive"} />
                      </div>
                    </td>
                    <td className="text-sm text-muted-foreground max-w-[180px] truncate">
                      {entry.note || "—"}
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {getFeaturedByName(entry.featuredBy)}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openEdit(entry)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={() => setDeletingEntry(entry)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-border">
            {featuredStores.map((entry, index) => (
              <div key={entry.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {entry.store?.bannerImageUrl ? (
                      <img
                        src={entry.store.bannerImageUrl}
                        alt={entry.store.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Star className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">{entry.store?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        #{entry.displayOrder} · {formatPlacement(entry.placement)}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={entry.isActive}
                    onCheckedChange={() => toggleActive(entry)}
                    disabled={updateMutation.isPending}
                  />
                </div>
                {entry.note && (
                  <p className="text-xs text-muted-foreground">{entry.note}</p>
                )}
                <div className="flex gap-2">
                  {canReorder && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => moveEntry(index, "up")}
                      >
                        Move up
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          index === featuredStores.length - 1 || reorderMutation.isPending
                        }
                        onClick={() => moveEntry(index, "down")}
                      >
                        Move down
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={() => openEdit(entry)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeletingEntry(entry)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateFeaturedStoreSheet open={createOpen} onOpenChange={setCreateOpen} />

      <Dialog open={Boolean(editingEntry)} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit featured store</DialogTitle>
            <DialogDescription>{editingEntry?.store?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Placement</Label>
              <Select
                value={editForm.placement}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, placement: value as FeaturedStorePlacement })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLACEMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-display-order">Display order</Label>
              <Input
                id="edit-display-order"
                type="number"
                min={0}
                value={editForm.displayOrder ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, displayOrder: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note (optional)</Label>
              <Textarea
                id="edit-note"
                value={editForm.note ?? ""}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Inactive entries are hidden from the marketplace
                </p>
              </div>
              <Switch
                checked={editForm.isActive ?? true}
                onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button disabled={updateMutation.isPending} onClick={handleEditSubmit}>
              {updateMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingEntry)} onOpenChange={(open) => !open && setDeletingEntry(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove featured store?</DialogTitle>
            <DialogDescription>
              <strong>{deletingEntry?.store?.name}</strong> will no longer appear in the
              spotlight for {formatPlacement(deletingEntry?.placement ?? "marketplace")}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingEntry(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingEntry && deleteMutation.mutate(deletingEntry.id)}
            >
              {deleteMutation.isPending ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
