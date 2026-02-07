import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, Store, Package, Briefcase, Image as ImageIcon } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getMarketplaceCategories, type GetMarketplaceCategoriesParams } from "@/services/marketplaceCategoriesApi";
import type { MarketplaceCategory } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function MarketplaceCategoriesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
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
  }, [typeFilter]);

  // Build query params
  const queryParams: GetMarketplaceCategoriesParams | undefined = useMemo(() => {
    // Only create params if a specific type is selected (API requires type parameter)
    if (typeFilter === "all") {
      return undefined;
    }

    const params: GetMarketplaceCategoriesParams = {
      type: typeFilter as "product" | "service",
      page,
      limit,
    };

    if (debouncedSearch) {
      params.searchTerm = debouncedSearch;
    }

    return params;
  }, [debouncedSearch, typeFilter, page, limit]);

  // Fetch categories - fetch both types when "all" is selected
  const {
    data: categoriesResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["marketplace-categories", queryParams, typeFilter],
    queryFn: async () => {
      if (typeFilter === "all") {
        // Fetch both product and service categories
        const [productResponse, serviceResponse] = await Promise.all([
          getMarketplaceCategories({ type: "product", page, limit, searchTerm: debouncedSearch }),
          getMarketplaceCategories({ type: "service", page, limit, searchTerm: debouncedSearch }),
        ]);

        // Combine results
        const combinedCategories = [
          ...(productResponse.data?.categories || []),
          ...(serviceResponse.data?.categories || []),
        ];

        // Combine pagination meta (use product meta as base, but adjust totals)
        const productMeta = productResponse.data?.meta;
        const serviceMeta = serviceResponse.data?.meta;
        
        return {
          status: true,
          message: "Categories retrieved successfully",
          data: {
            categories: combinedCategories,
            meta: productMeta ? {
              ...productMeta,
              total: (productMeta.total || 0) + (serviceMeta?.total || 0),
            } : {
              total: combinedCategories.length,
              limit,
              page,
              totalPages: 1,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
        };
      } else {
        return getMarketplaceCategories(queryParams!);
      }
    },
    enabled: queryParams !== undefined || typeFilter === "all",
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const categories = useMemo(() => {
    return (categoriesResponse?.data?.categories || []).map((category) => ({
      ...category,
      createdAt: new Date(category.createdAt),
      updatedAt: new Date(category.updatedAt),
    }));
  }, [categoriesResponse?.data?.categories]);

  // Handle pagination meta
  const paginationMeta = useMemo(() => {
    const meta = categoriesResponse?.data?.meta;
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
  }, [categoriesResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading categories",
        description: error instanceof Error ? error.message : "Failed to fetch marketplace categories",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const typeOptions = [
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
  ];

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
        title="Marketplace Categories"
        description="Manage categories for marketplace products and services"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search categories..."
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="Category Type"
          options={typeOptions}
          allLabel="All Types"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} rows={10} />
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Store className="h-12 w-12" />}
            title="No categories found"
            description={
              search || typeFilter
                ? "Try adjusting your search or filters"
                : "Categories will appear here once they are created"
            }
          />
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Subcategories</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          {category.imageUrl ? (
                            <AvatarImage src={category.imageUrl} alt={category.name} />
                          ) : category.icon ? (
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {category.icon}
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <ImageIcon className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{category.name}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {category.icon ? (
                          <img src={category.icon} alt={category.name} className="h-4 w-4 object-contain" />
                        ) : category.type === "product" ? (
                          <Package className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Briefcase className="h-4 w-4 text-green-600" />
                        )}
                        <span className="text-sm text-foreground capitalize">
                          {category.type}
                        </span>
                      </div>
                    </td>
                    <td>
                      {category.subcategories.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-sm text-foreground hover:text-primary cursor-pointer underline-offset-4 hover:underline">
                              {category.subcategories.length} {category.subcategories.length === 1 ? "subcategory" : "subcategories"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3" align="start">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-foreground mb-2">Subcategories</h4>
                              <ul className="space-y-1">
                                {category.subcategories.map((subcategory, index) => (
                                  <li key={index} className="text-sm text-muted-foreground">
                                    • {subcategory}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-sm text-muted-foreground">No subcategories</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-foreground">{formatDate(category.createdAt)}</p>
                    </td>
                    <td className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/categories/marketplace/${category.id}`)}
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
                {paginationMeta.total} categories
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
