import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, Sparkles, Heart, MessageCircle, Share2, Eye as EyeIcon, Bookmark, Lock, Globe, User } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  EmptyState,
  GlitSkeletonGrid,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { getGlits, type GetGlitsParams } from "@/services/glitsApi";
import { getMarketplaceCategories } from "@/services/marketplaceCategoriesApi";
import type { Glit } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function GlitFinderPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [privacyFilter, setPrivacyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const { toast } = useToast();

  // Fetch marketplace categories for the dropdown
  const { data: categoriesResponse } = useQuery({
    queryKey: ["marketplace-categories-all"],
    queryFn: async () => {
      // Fetch both product and service categories
      const [productResponse, serviceResponse] = await Promise.all([
        getMarketplaceCategories({ type: "product", limit: 500 }),
        getMarketplaceCategories({ type: "service", limit: 500 }),
      ]);

      // Combine and deduplicate categories by name
      const allCategories = [
        ...(productResponse.data?.categories || []),
        ...(serviceResponse.data?.categories || []),
      ];

      // Deduplicate by name (case-insensitive)
      const uniqueCategories = Array.from(
        new Map(allCategories.map(cat => [cat.name.toLowerCase(), cat])).values()
      );

      return {
        status: true,
        message: "Categories retrieved successfully",
        data: {
          categories: uniqueCategories,
        },
      };
    },
    retry: 1,
  });

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
  }, [categoryFilter, privacyFilter]);

  // Build query params
  const queryParams: GetGlitsParams = useMemo(() => {
    const params: GetGlitsParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (categoryFilter && categoryFilter !== "all") {
      params.category = categoryFilter;
    }

    if (privacyFilter !== "all") {
      params.isPrivate = privacyFilter === "private";
    }

    return params;
  }, [debouncedSearch, categoryFilter, privacyFilter, page, limit]);

  // Fetch glits
  const {
    data: glitsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["glits", queryParams],
    queryFn: () => getGlits(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const glits = useMemo(() => {
    return (glitsResponse?.data?.glits || []).map((glit) => ({
      ...glit,
      id: glit._id || glit.id, // Use _id as id for compatibility
      createdAt: new Date(glit.createdAt),
      updatedAt: new Date(glit.updatedAt),
      glitProfile: glit.glitProfile ? {
        ...glit.glitProfile,
        createdAt: new Date(glit.glitProfile.createdAt),
        updatedAt: new Date(glit.glitProfile.updatedAt),
      } : undefined,
    }));
  }, [glitsResponse?.data?.glits]);

  // Handle pagination meta
  const paginationMeta = useMemo(() => {
    const meta = glitsResponse?.data?.meta;
    if (!meta) return undefined;
    
    // Handle inconsistent API response format
    const rawMeta = meta as unknown as Record<string, unknown>;
    
    return {
      ...meta,
      page: typeof meta.page === 'string' ? parseInt(meta.page) : meta.page,
      limit: typeof meta.limit === 'string' ? parseInt(meta.limit) : meta.limit,
      total: (rawMeta.totalDocs as number) || meta.total || 0,
      hasPrevPage: (rawMeta.hasPreviousPage as boolean) ?? meta.hasPrevPage ?? false,
    };
  }, [glitsResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading glits",
        description: error instanceof Error ? error.message : "Failed to fetch glits",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const privacyOptions = [
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

  // Build category options from marketplace categories
  const categoryOptions = useMemo(() => {
    const categories = categoriesResponse?.data?.categories || [];
    return categories.map((cat) => ({
      value: cat.name,
      label: cat.name,
    }));
  }, [categoriesResponse?.data?.categories]);

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
        title="GlitFinder"
        description="Browse and manage all glits"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search glits..."
        />
        <FilterSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          placeholder="Category"
          options={categoryOptions}
          allLabel="All Categories"
        />
        <FilterSelect
          value={privacyFilter}
          onChange={setPrivacyFilter}
          placeholder="Privacy"
          options={privacyOptions}
          allLabel="All Privacy"
        />
      </div>

      {isLoading ? (
        <GlitSkeletonGrid count={10} />
      ) : glits.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Sparkles className="h-12 w-12" />}
            title="No glits found"
            description={
              search || categoryFilter || privacyFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Glits will appear here once they are created"
            }
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {glits.map((glit) => (
              <div
                key={glit.id}
                className="group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-primary/50"
                onClick={() => navigate(`/glitfinder/${glit.id}`)}
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {(glit.image || (glit.images && glit.images.length > 0)) ? (
                    <>
                      <img
                        src={glit.image || glit.images?.[0]}
                        alt={glit.title || glit.description?.slice(0, 50)}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {/* Privacy indicator */}
                      <div className="absolute top-2 right-2">
                        {glit.isPrivate ? (
                          <div className="bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                            <Lock className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                            <Globe className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      {/* Stats overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
                        <div className="flex items-center justify-between text-white text-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              <span>{glit.likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              <span>{glit.shares}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <EyeIcon className="h-3 w-3" />
                              <span>{glit.views}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bookmark className="h-3 w-3" />
                              <span>{glit.saves}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-3 space-y-2">
                  {/* User Info */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 shrink-0">
                      {glit.glitProfile?.profilePicture ? (
                        <AvatarImage src={glit.glitProfile.profilePicture} alt={glit.glitProfile.username} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                          {glit.glitProfile?.username ? getInitials(glit.glitProfile.username) : "??"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-xs truncate">
                        {glit.glitProfile?.username || `User ${glit.user.slice(0, 8)}`}
                      </p>
                    </div>
                  </div>

                  {/* Title */}
                  {glit.title && (
                    <p className="font-semibold text-foreground text-xs line-clamp-1">
                      {glit.title}
                    </p>
                  )}

                  {/* Description */}
                  {glit.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {glit.description}
                    </p>
                  )}

                  {/* Category & Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {glit.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium capitalize">
                        {glit.category}
                      </span>
                    )}
                    {glit.tags && glit.tags.length > 0 && (
                      <>
                        {glit.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                        {glit.tags.length > 2 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{glit.tags.length - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(glit.createdAt)}
                    </span>
                    {glit.creatorType && (
                      <span className="text-[10px] text-muted-foreground capitalize">
                        {glit.creatorType.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1} to{" "}
                {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                {paginationMeta.total} glits
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
        </>
      )}
    </div>
  );
}

