import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, Sparkles, Heart, MessageCircle, Share2, Eye as EyeIcon, Bookmark, Lock, Globe, User, X, Trash2 } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  EmptyState,
  GlitSkeletonGrid,
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getGlits, getGlitById, getUserGlits, deleteGlit, type GetGlitsParams } from "@/services/glitsApi";
import { getGlitProfileByUserId } from "@/services/glitProfilesApi";
import { getMarketplaceCategories } from "@/services/marketplaceCategoriesApi";
import type { Glit } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function GlitFinderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [privacyFilter, setPrivacyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const { toast } = useToast();
  
  // Modal state
  const [selectedGlitId, setSelectedGlitId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Profile Sheet state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userGlitsPage, setUserGlitsPage] = useState(1);
  const userGlitsLimit = 12;

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

  // Fetch single glit
  const {
    data: glitResponse,
    isLoading: isLoadingGlit,
    isError: isGlitError,
    error: glitError,
  } = useQuery({
    queryKey: ["glit", selectedGlitId],
    queryFn: () => getGlitById(selectedGlitId!),
    enabled: !!selectedGlitId,
    retry: 1,
  });

  const selectedGlit = useMemo(() => {
    if (!glitResponse?.data?.glit) return null;
    const glit = glitResponse.data.glit;
    return {
      ...glit,
      id: glit._id || glit.id,
      createdAt: new Date(glit.createdAt),
      updatedAt: new Date(glit.updatedAt),
      glitProfile: glit.glitProfile ? {
        ...glit.glitProfile,
        createdAt: new Date(glit.glitProfile.createdAt),
        updatedAt: new Date(glit.glitProfile.updatedAt),
      } : undefined,
    };
  }, [glitResponse?.data?.glit]);

  // Delete glit mutation
  const deleteMutation = useMutation({
    mutationFn: deleteGlit,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Glit deleted successfully",
        variant: "success",
      });
      setIsDeleteDialogOpen(false);
      setSelectedGlitId(null);
      queryClient.invalidateQueries({ queryKey: ["glits"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting glit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle card click
  const handleCardClick = (glit: Glit, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGlitId(glit.id);
  };

  // Handle delete click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (selectedGlitId) {
      deleteMutation.mutate(selectedGlitId);
    }
  };

  // Fetch glit profile
  const {
    data: profileResponse,
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError,
  } = useQuery({
    queryKey: ["glit-profile", selectedUserId],
    queryFn: () => getGlitProfileByUserId(selectedUserId!),
    enabled: !!selectedUserId,
    retry: 1,
  });

  const profile = useMemo(() => {
    if (!profileResponse?.data?.profile) return null;
    const prof = profileResponse.data.profile;
    return {
      ...prof,
      createdAt: new Date(prof.createdAt),
      updatedAt: new Date(prof.updatedAt),
      dateOfBirth: prof.dateOfBirth ? new Date(prof.dateOfBirth) : undefined,
    };
  }, [profileResponse?.data?.profile]);

  // Fetch user glits
  const {
    data: userGlitsResponse,
    isLoading: isLoadingUserGlits,
  } = useQuery({
    queryKey: ["user-glits", selectedUserId, userGlitsPage],
    queryFn: () => getUserGlits(selectedUserId!, { page: userGlitsPage, limit: userGlitsLimit }),
    enabled: !!selectedUserId,
    retry: 1,
  });

  const userGlits = useMemo(() => {
    return (userGlitsResponse?.data?.glits || []).map((glit) => ({
      ...glit,
      id: glit._id || glit.id,
      createdAt: new Date(glit.createdAt),
      updatedAt: new Date(glit.updatedAt),
      glitProfile: glit.glitProfile ? {
        ...glit.glitProfile,
        createdAt: new Date(glit.glitProfile.createdAt),
        updatedAt: new Date(glit.glitProfile.updatedAt),
      } : undefined,
    }));
  }, [userGlitsResponse?.data?.glits]);

  const userGlitsMeta = useMemo(() => {
    const meta = userGlitsResponse?.data?.meta;
    if (!meta) return undefined;
    
    // Handle API response format - API uses totalDocs, hasNextPage, hasPreviousPage
    const rawMeta = meta as unknown as Record<string, unknown>;
    
    return {
      page: typeof meta.page === 'string' ? parseInt(meta.page) : meta.page,
      limit: typeof meta.limit === 'string' ? parseInt(meta.limit) : meta.limit,
      total: (rawMeta.totalDocs as number) || meta.total || 0,
      totalPages: rawMeta.totalPages as number || meta.totalPages || 1,
      hasNextPage: (rawMeta.hasNextPage as boolean) ?? meta.hasNextPage ?? false,
      hasPrevPage: (rawMeta.hasPreviousPage as boolean) ?? meta.hasPrevPage ?? false,
    };
  }, [userGlitsResponse?.data?.meta]);

  // Handle glit fetch error
  useEffect(() => {
    if (isGlitError && selectedGlitId) {
      toast({
        title: "Error loading glit",
        description: glitError instanceof Error ? glitError.message : "Failed to fetch glit details",
        variant: "destructive",
      });
      setSelectedGlitId(null);
    }
  }, [isGlitError, glitError, selectedGlitId, toast]);

  // Handle profile fetch error
  useEffect(() => {
    if (isProfileError && selectedUserId) {
      toast({
        title: "Error loading profile",
        description: profileError instanceof Error ? profileError.message : "Failed to fetch profile",
        variant: "destructive",
      });
      setSelectedUserId(null);
    }
  }, [isProfileError, profileError, selectedUserId, toast]);

  // Handle poster click
  const handlePosterClick = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserId(userId);
    setUserGlitsPage(1); // Reset to first page when opening profile
  };

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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {glits.map((glit) => (
              <div
                key={glit.id}
                className="group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer transition-all hover:border-primary/50 flex flex-col"
                onClick={(e) => handleCardClick(glit, e)}
              >
                {/* Image Container */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {(glit.image || (glit.images && glit.images.length > 0)) ? (
                    <>
                      <img
                        src={glit.image || glit.images?.[0]}
                        alt={glit.title || glit.description?.slice(0, 50)}
                        loading="lazy"
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
                <div className="p-3 flex flex-col flex-1">
                  <div className="space-y-2 flex-1">
                    {/* User Info */}
                    <div 
                      className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => handlePosterClick(glit.user, e)}
                    >
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
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
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
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1}–{Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of {paginationMeta.total} glits
              </div>
              <div className="pagination-controls">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!paginationMeta.hasPrevPage || isLoading}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {paginationMeta.page} of {paginationMeta.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!paginationMeta.hasNextPage || isLoading}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Glit Details Modal */}
      <Dialog open={!!selectedGlitId && !isDeleteDialogOpen} onOpenChange={(open) => !open && setSelectedGlitId(null)}>
        <DialogContent className="w-[95vw] max-w-5xl h-[92vh] max-h-[92vh] overflow-hidden p-0 gap-0">
          {isLoadingGlit ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 shrink-0">
                <Skeleton className="h-6 w-32" />
              </div>

              {/* Content Skeleton */}
              <div className="overflow-y-auto flex-1 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Image Skeleton */}
                  <div className="relative bg-gradient-to-br from-muted/30 via-muted/10 to-background min-h-[220px] sm:min-h-[320px] lg:min-h-[500px] flex items-center justify-center p-4 sm:p-6 lg:border-r border-b lg:border-b-0 border-border/50">
                    <Skeleton className="w-full max-w-[550px] aspect-square rounded-lg" />
                  </div>

                  {/* Details Skeleton */}
                  <div className="p-4 sm:p-6 space-y-5 bg-background">
                    {/* User Info Skeleton */}
                    <div className="flex items-start gap-3 pb-4 border-b border-dashed border-border/60">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>

                    {/* Title & Description Skeleton */}
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <div className="space-y-2 pt-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>

                    {/* Tags Skeleton */}
                    <div className="flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>

                    {/* Engagement Stats Skeleton */}
                    <div className="pt-4 border-t border-dashed border-border/60">
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex flex-col items-center p-3 rounded-lg bg-muted/40 border border-border/30">
                            <Skeleton className="h-8 w-8 rounded-md mb-2" />
                            <Skeleton className="h-6 w-12 mb-1" />
                            <Skeleton className="h-3 w-10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Skeleton */}
              <div className="flex items-center justify-end px-4 sm:px-6 py-4 border-t border-border/50 shrink-0">
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
          ) : selectedGlit ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
                <DialogHeader className="flex-1">
                  <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Glit Details
                  </DialogTitle>
                </DialogHeader>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto flex-1 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Image Section */}
                  {(selectedGlit.image || (selectedGlit.images && selectedGlit.images.length > 0)) && (
                    <div className="relative bg-gradient-to-br from-muted/30 via-muted/10 to-background min-h-[220px] sm:min-h-[320px] lg:min-h-[500px] flex items-center justify-center p-4 sm:p-6 lg:border-r border-b lg:border-b-0 border-border/50">
                      <div className="relative w-full h-full flex items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img
                          src={selectedGlit.image || selectedGlit.images?.[0]}
                          alt={selectedGlit.title || selectedGlit.description?.slice(0, 50)}
                          className="max-w-full max-h-[280px] sm:max-h-[400px] lg:max-h-[500px] object-contain rounded-lg shadow-xl ring-2 ring-border/30 group-hover:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>
                  )}

                  {/* Details Section */}
                  <div className="p-4 sm:p-6 space-y-5 bg-background">
                    {/* User Info */}
                    <div 
                      className="flex items-start gap-3 pb-4 border-b border-dashed border-border/60 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePosterClick(selectedGlit.user, e);
                      }}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12 shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                          {selectedGlit.glitProfile?.profilePicture ? (
                            <AvatarImage src={selectedGlit.glitProfile.profilePicture} alt={selectedGlit.glitProfile.username} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {selectedGlit.glitProfile?.username ? getInitials(selectedGlit.glitProfile.username) : "??"}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {selectedGlit.isPrivate ? (
                          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                            <Globe className="h-3 w-3 text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-foreground">
                            {selectedGlit.glitProfile?.username || `User ${selectedGlit.user.slice(0, 8)}`}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="opacity-60">Posted</span>
                          <span className="font-medium">{formatDate(selectedGlit.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-3">
                      {selectedGlit.title && (
                        <div>
                          <h2 className="text-xl font-bold text-foreground leading-snug">{selectedGlit.title}</h2>
                        </div>
                      )}

                      {selectedGlit.description && (
                        <div>
                          <p className="text-sm text-foreground/80 leading-relaxed">{selectedGlit.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Category & Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedGlit.category && (
                        <Badge className="capitalize text-xs px-2.5 py-1 bg-primary/10 text-primary border border-primary/20">
                          {selectedGlit.category}
                        </Badge>
                      )}
                      {selectedGlit.tags && selectedGlit.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                          #{tag}
                        </Badge>
                      ))}
                      {selectedGlit.tags && selectedGlit.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          +{selectedGlit.tags.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Engagement Stats */}
                    <div className="pt-4 border-t border-dashed border-border/60">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-border/30 hover:border-primary/20 group cursor-default">
                          <div className="p-1.5 rounded-md bg-red-500/10 group-hover:bg-red-500/20 transition-colors mb-1.5">
                            <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{selectedGlit.likes.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Likes</p>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-border/30 hover:border-blue-500/20 group cursor-default">
                          <div className="p-1.5 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors mb-1.5">
                            <Share2 className="h-4 w-4 text-blue-500" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{selectedGlit.shares.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Shares</p>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-border/30 hover:border-green-500/20 group cursor-default">
                          <div className="p-1.5 rounded-md bg-green-500/10 group-hover:bg-green-500/20 transition-colors mb-1.5">
                            <EyeIcon className="h-4 w-4 text-green-500" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{selectedGlit.views.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Views</p>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-border/30 hover:border-purple-500/20 group cursor-default">
                          <div className="p-1.5 rounded-md bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors mb-1.5">
                            <Bookmark className="h-4 w-4 text-purple-500 fill-purple-500" />
                          </div>
                          <p className="text-lg font-bold text-foreground">{selectedGlit.saves.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Saves</p>
                        </div>
                      </div>
                    </div>

                    {/* Creator Type */}
                    {selectedGlit.creatorType && (
                      <div className="pt-3 border-t border-dashed border-border/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Creator</span>
                          <Badge variant="outline" className="capitalize text-xs px-2.5 py-1">
                            {selectedGlit.creatorType.replace(/([A-Z])/g, ' $1').trim()}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer with Delete Button */}
              <div className="flex items-center justify-end px-4 sm:px-6 py-4 border-t border-border/50 bg-card/50 backdrop-blur-sm shrink-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteClick}
                  className="hover:scale-105 transition-transform"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Glit</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this glit? This action cannot be undone.
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

      {/* Profile Sheet */}
      <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl h-auto overflow-y-auto m-3 rounded-md">
          {isLoadingProfile ? (
            <div className="space-y-6">
              {/* Header Skeleton */}
              <SheetHeader>
                <Skeleton className="h-7 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </SheetHeader>

              {/* Profile Picture Skeleton */}
              <div className="flex flex-col items-center gap-4 py-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2 text-center">
                  <Skeleton className="h-6 w-32 mx-auto" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </div>
              </div>

              {/* Bio Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>

              {/* Stats Skeleton */}
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-6 w-12 mx-auto mb-1" />
                    <Skeleton className="h-4 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ) : profile ? (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Glit Profile
                </SheetTitle>
                <SheetDescription>
                  Profile information for {profile.username}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4">
                {/* Profile Information - Compact */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Profile Information
                  </h3>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                      {profile.profilePicture ? (
                        <AvatarImage src={profile.profilePicture} alt={profile.username} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                          {getInitials(profile.username)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-bold text-foreground">{profile.username}</h2>
                        {profile.isPrivate ? (
                          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                            <Lock className="h-3 w-3" />
                            Private
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                            <Globe className="h-3 w-3" />
                            Public
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center p-2 bg-muted/30 rounded-md">
                      <p className="text-lg font-bold text-foreground">{profile.followers?.length || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Followers</p>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded-md">
                      <p className="text-lg font-bold text-foreground">{profile.following?.length || 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Following</p>
                    </div>
                    <div className="text-center p-2 bg-muted/30 rounded-md">
                      <p className="text-lg font-bold text-foreground">
                        {(profile.followers?.length || 0) + (profile.following?.length || 0)}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase">Total</p>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                      Bio
                    </h3>
                    <p className="text-sm text-foreground leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Additional Information */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {profile.dateOfBirth && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Date of Birth
                        </label>
                        <p className="text-sm text-foreground">
                          {new Date(profile.dateOfBirth).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Member Since
                      </label>
                      <p className="text-sm text-foreground">
                        {formatDate(profile.createdAt)}
                      </p>
                    </div>
                    {profile.usernameChangedLast && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Username Changed
                        </label>
                        <p className="text-sm text-foreground">
                          {formatDate(new Date(profile.usernameChangedLast))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* User's Glits */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2 mt-8">
                    User's Glits ({userGlitsMeta?.total || 0})
                  </h3>
                  {isLoadingUserGlits ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : userGlits.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No glits found
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        {userGlits.map((glit) => (
                          <div
                            key={glit.id}
                            className="group relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary/50 transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCardClick(glit, e);
                            }}
                          >
                            {(glit.image || (glit.images && glit.images.length > 0)) ? (
                              <img
                                src={glit.image || glit.images?.[0]}
                                alt={glit.title || glit.description?.slice(0, 50)}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            {/* Stats overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center justify-between text-white text-[10px]">
                                <div className="flex items-center gap-1.5">
                                  <Heart className="h-2.5 w-2.5" />
                                  <span>{glit.likes}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <EyeIcon className="h-2.5 w-2.5" />
                                  <span>{glit.views}</span>
                                </div>
                              </div>
                            </div>
                            {/* Privacy indicator */}
                            <div className="absolute top-1 right-1">
                              {glit.isPrivate ? (
                                <div className="bg-black/50 backdrop-blur-sm rounded-full p-1">
                                  <Lock className="h-2 w-2 text-white" />
                                </div>
                              ) : (
                                <div className="bg-black/50 backdrop-blur-sm rounded-full p-1">
                                  <Globe className="h-2 w-2 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Pagination */}
                      {userGlitsMeta && userGlitsMeta.totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground">
                            Page {userGlitsMeta.page} of {userGlitsMeta.totalPages}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUserGlitsPage((p) => Math.max(1, p - 1))}
                              disabled={!userGlitsMeta.hasPrevPage || isLoadingUserGlits}
                              className="h-7 text-xs"
                            >
                              Prev
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setUserGlitsPage((p) => p + 1)}
                              disabled={!userGlitsMeta.hasNextPage || isLoadingUserGlits}
                              className="h-7 text-xs"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

