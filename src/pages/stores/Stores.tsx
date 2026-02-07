import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Eye, Store as StoreIcon, MapPin, Star } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  EmptyState,
  StatusBadge,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStores, type GetStoresParams } from "@/services/storesApi";
import type { Store } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function StoresPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  // Build query params
  const queryParams: GetStoresParams = useMemo(() => {
    const params: GetStoresParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.name = debouncedSearch;
    }

    return params;
  }, [debouncedSearch, page, limit]);

  // Fetch stores
  const {
    data: storesResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["stores", queryParams],
    queryFn: () => getStores(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const stores = useMemo(() => {
    return (storesResponse?.data?.stores || []).map((store) => ({
      ...store,
      createdAt: new Date(store.createdAt),
      updatedAt: new Date(store.updatedAt),
    }));
  }, [storesResponse?.data?.stores]);

  const paginationMeta = storesResponse?.data?.meta;

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading stores",
        description: error instanceof Error ? error.message : "Failed to fetch stores",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

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
        title="Stores"
        description="View and manage vendor stores"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search stores..."
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={8} rows={10} />
      ) : stores.length === 0 ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <EmptyState
            title="No stores found"
            description="Try adjusting your search criteria"
            icon={<StoreIcon className="h-6 w-6" />}
          />
        </div>
      ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Rating</th>
                  <th>Views</th>
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
                        <p className="font-medium text-foreground">
                          {store.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                          {store.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {store.type && store.type.length > 0 ? (
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
                        <MapPin className="h-3 w-3" />
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
                        <span className="text-xs text-muted-foreground mt-[1.5px]">
                          ({store.reviewCount})
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No reviews</span>
                    )}
                  </td>
                  <td className="text-muted-foreground">
                    {store.viewCount.toLocaleString()}
                  </td>
                  <td>
                    <StatusBadge status={store.status} />
                  </td>
                  <td className="text-muted-foreground">
                    {formatDate(store.createdAt)}
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1} to{" "}
                  {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                  {paginationMeta.total} stores
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
