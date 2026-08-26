import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FilterSearchSelect } from "@/components/shared/DataTable";
import { createFeaturedStore, type CreateFeaturedStorePayload } from "@/services/featuredStoresApi";
import { getAdminStores } from "@/services/storesApi";
import type { FeaturedStorePlacement } from "@/types/api";
import { normalizeStoreFromApi } from "@/lib/storeUtils";
import { useToast } from "@/hooks/use-toast";

const PLACEMENT_OPTIONS: { value: FeaturedStorePlacement; label: string }[] = [
  { value: "marketplace", label: "Marketplace" },
  { value: "homepage", label: "Homepage" },
];

interface CreateFeaturedStoreSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStoreId?: string;
  initialStoreName?: string;
  onCreated?: () => void;
}

export function CreateFeaturedStoreSheet({
  open,
  onOpenChange,
  initialStoreId,
  initialStoreName,
  onCreated,
}: CreateFeaturedStoreSheetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [storeId, setStoreId] = useState("all");
  const [selectedStoreLabel, setSelectedStoreLabel] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [debouncedStoreSearch, setDebouncedStoreSearch] = useState("");
  const [placement, setPlacement] = useState<FeaturedStorePlacement>("marketplace");
  const [displayOrder, setDisplayOrder] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedStoreSearch(storeSearch), 300);
    return () => clearTimeout(timer);
  }, [storeSearch]);

  useEffect(() => {
    if (!open) {
      setStoreId("all");
      setSelectedStoreLabel(null);
      setStoreSearch("");
      setDebouncedStoreSearch("");
      setPlacement("marketplace");
      setDisplayOrder("");
      setNote("");
      return;
    }

    if (initialStoreId) {
      setStoreId(initialStoreId);
      setSelectedStoreLabel(initialStoreName ?? null);
    }
  }, [open, initialStoreId, initialStoreName]);

  const { data: storesResponse, isFetching: isStoresLoading } = useQuery({
    queryKey: ["published-stores-feature", debouncedStoreSearch],
    queryFn: () =>
      getAdminStores({
        page: 1,
        limit: debouncedStoreSearch.trim() ? 100 : 5,
        isPublic: true,
      }),
    enabled: open,
    staleTime: 60 * 1000,
  });

  const storeOptions = useMemo(() => {
    const term = debouncedStoreSearch.trim().toLowerCase();
    return (storesResponse?.data?.stores || [])
      .map((store) => normalizeStoreFromApi(store as Parameters<typeof normalizeStoreFromApi>[0]))
      .map((store) => ({ value: store.id, label: store.name }))
      .filter((store) => store.value)
      .filter((store) => !term || store.label.toLowerCase().includes(term))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [storesResponse?.data?.stores, debouncedStoreSearch]);

  const createMutation = useMutation({
    mutationFn: createFeaturedStore,
    onSuccess: () => {
      toast({
        title: "Store featured",
        description: "The store has been added to the spotlight list.",
        variant: "success",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["featured-stores"] });
      onCreated?.();
    },
    onError: (err: Error) => {
      toast({
        title: "Could not feature store",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleStoreChange = (value: string) => {
    setStoreId(value);
    if (value === "all") {
      setSelectedStoreLabel(null);
      return;
    }
    const match = storeOptions.find((store) => store.value === value);
    if (match) setSelectedStoreLabel(match.label);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (storeId === "all") {
      toast({
        title: "Validation",
        description: "Select a published store to feature",
        variant: "destructive",
      });
      return;
    }

    const payload: CreateFeaturedStorePayload = {
      storeId,
      placement,
    };

    if (displayOrder.trim()) {
      const order = Number(displayOrder);
      if (Number.isNaN(order) || order < 0) {
        toast({
          title: "Validation",
          description: "Display order must be a non-negative number",
          variant: "destructive",
        });
        return;
      }
      payload.displayOrder = order;
    }

    if (note.trim()) payload.note = note.trim();

    createMutation.mutate(payload);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Feature store
          </SheetTitle>
          <SheetDescription>
            Spotlight a published store on the marketplace or homepage.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>
              Store <span className="text-destructive">*</span>
            </Label>
            <FilterSearchSelect
              value={storeId}
              onChange={handleStoreChange}
              placeholder="Select store"
              options={storeOptions}
              allLabel="Select store"
              searchPlaceholder="Search published stores..."
              defaultVisibleCount={5}
              onSearchChange={setStoreSearch}
              selectedLabel={selectedStoreLabel ?? undefined}
              isLoading={isStoresLoading}
            />
            <p className="text-xs text-muted-foreground">
              Only published stores can be featured.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Placement</Label>
            <Select
              value={placement}
              onValueChange={(value) => setPlacement(value as FeaturedStorePlacement)}
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
            <Label htmlFor="featured-display-order">Display order (optional)</Label>
            <Input
              id="featured-display-order"
              type="number"
              min={0}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              placeholder="Auto-assigned if blank"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="featured-note">Note (optional)</Label>
            <Textarea
              id="featured-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Launch partner"
              rows={3}
            />
          </div>

          <SheetFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Featuring…" : "Feature store"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
