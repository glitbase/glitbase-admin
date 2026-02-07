import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Sparkles, Image as ImageIcon, Plus, Edit, Trash2 } from "lucide-react";
import {
  PageHeader,
  SearchInput,
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
import { getInspirationCategories, createInspirationCategory, updateInspirationCategory, deleteInspirationCategory, type GetInspirationCategoriesParams, type CreateInspirationCategoryPayload, type UpdateInspirationCategoryPayload } from "@/services/inspirationCategoriesApi";
import type { InspirationCategory } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function InspirationCategoriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const { toast } = useToast();
  
  // Create dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateInspirationCategoryPayload>({
    title: "",
    emoji: "",
    type: "stylesInspo",
  });
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InspirationCategory | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateInspirationCategoryPayload>({});
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<InspirationCategory | null>(null);

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
  const queryParams: GetInspirationCategoriesParams | undefined = useMemo(() => {
    const params: GetInspirationCategoriesParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    if (typeFilter !== "all") {
      params.type = typeFilter as "stylesInspo" | "touchupsTransformations";
    }

    return params;
  }, [debouncedSearch, typeFilter, page, limit]);

  // Fetch categories
  const {
    data: categoriesResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["inspiration-categories", queryParams],
    queryFn: () => getInspirationCategories(queryParams),
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
        description: error instanceof Error ? error.message : "Failed to fetch inspiration categories",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: createInspirationCategory,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
        variant: "success",
      });
      setIsCreateDialogOpen(false);
      setFormData({ title: "", emoji: "", type: "stylesInspo" });
      queryClient.invalidateQueries({ queryKey: ["inspiration-categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update category mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInspirationCategoryPayload }) =>
      updateInspirationCategory(id, payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category updated successfully",
        variant: "success",
      });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      setEditFormData({});
      queryClient.invalidateQueries({ queryKey: ["inspiration-categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteMutation = useMutation({
    mutationFn: deleteInspirationCategory,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category deleted successfully",
        variant: "success",
      });
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      queryClient.invalidateQueries({ queryKey: ["inspiration-categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Category title is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.emoji.trim()) {
      toast({
        title: "Validation Error",
        description: "Category emoji is required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  // Handle edit form submission
  const handleEditSubmit = () => {
    if (!editingCategory) return;

    const payload: UpdateInspirationCategoryPayload = {};
    
    if (editFormData.title !== undefined && editFormData.title.trim() !== editingCategory.title) {
      payload.title = editFormData.title.trim();
    }
    if (editFormData.emoji !== undefined && editFormData.emoji.trim() !== editingCategory.emoji) {
      payload.emoji = editFormData.emoji.trim();
    }
    if (editFormData.type !== undefined && editFormData.type !== editingCategory.type) {
      payload.type = editFormData.type;
    }

    if (Object.keys(payload).length === 0) {
      toast({
        title: "No Changes",
        description: "No changes were made to the category",
      });
      return;
    }

    updateMutation.mutate({ id: editingCategory.id, payload });
  };

  // Open edit dialog
  const handleEdit = (category: InspirationCategory) => {
    setEditingCategory(category);
    setEditFormData({
      title: category.title,
      emoji: category.emoji,
      type: category.type,
    });
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation
  const handleDeleteClick = (category: InspirationCategory) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (deletingCategory) {
      deleteMutation.mutate(deletingCategory.id);
    }
  };

  const typeOptions = [
    { value: "stylesInspo", label: "Styles Inspiration" },
    { value: "touchupsTransformations", label: "Touchups & Transformations" },
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
        title="Inspiration Categories"
        description="Manage categories for inspiration content"
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
        <Button onClick={() => setIsCreateDialogOpen(true)} className="ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} rows={10} />
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Sparkles className="h-12 w-12" />}
            title="No categories found"
            description={
              search || typeFilter !== "all"
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
                            <AvatarImage src={category.imageUrl} alt={category.title} />
                          ) : category.icon ? (
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              <img src={category.icon} alt={category.title} className="h-full w-full object-contain" />
                            </AvatarFallback>
                          ) : category.emoji ? (
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">
                              {category.emoji}
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <ImageIcon className="h-5 w-5" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{category.title}</p>
                          {category.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {category.type ? (
                        <span className="text-sm text-foreground capitalize">
                          {category.type === "stylesInspo" ? "Styles Inspiration" : "Touchups & Transformations"}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td>
                      <p className="text-sm text-foreground">{formatDate(category.createdAt)}</p>
                    </td>
                    <td className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(category)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(category)}
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

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Inspiration Category</DialogTitle>
            <DialogDescription>
              Add a new category for inspiration content
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Hair Styles"
              />
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <Label htmlFor="emoji">
                Emoji <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emoji"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                placeholder="e.g., 💇"
                maxLength={10}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "stylesInspo" | "touchupsTransformations") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stylesInspo">Styles Inspiration</SelectItem>
                  <SelectItem value="touchupsTransformations">Touchups & Transformations</SelectItem>
                </SelectContent>
              </Select>
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
              {createMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inspiration Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title || ""}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="e.g., Hair Styles"
              />
            </div>

            {/* Emoji */}
            <div className="space-y-2">
              <Label htmlFor="edit-emoji">Emoji</Label>
              <Input
                id="edit-emoji"
                value={editFormData.emoji || ""}
                onChange={(e) => setEditFormData({ ...editFormData, emoji: e.target.value })}
                placeholder="e.g., 💇"
                maxLength={10}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editFormData.type || "stylesInspo"}
                onValueChange={(value: "stylesInspo" | "touchupsTransformations") =>
                  setEditFormData({ ...editFormData, type: value })
                }
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stylesInspo">Styles Inspiration</SelectItem>
                  <SelectItem value="touchupsTransformations">Touchups & Transformations</SelectItem>
                </SelectContent>
              </Select>
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
              {updateMutation.isPending ? "Updating..." : "Update Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{deletingCategory?.title}"? This action cannot be undone.
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
