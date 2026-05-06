import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Store, Package, Briefcase, Image as ImageIcon, Plus, X, Edit, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { getMarketplaceCategories, createMarketplaceCategory, updateMarketplaceCategory, deleteMarketplaceCategory, type GetMarketplaceCategoriesParams, type CreateMarketplaceCategoryPayload, type UpdateMarketplaceCategoryPayload } from "@/services/marketplaceCategoriesApi";
import type { MarketplaceCategory } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function MarketplaceCategoriesPage() {
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
  const [formData, setFormData] = useState<CreateMarketplaceCategoryPayload>({
    name: "",
    type: "product",
    subcategories: [],
    description: "",
    imageUrl: "",
    icon: "",
  });
  const [subcategoryInput, setSubcategoryInput] = useState("");
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MarketplaceCategory | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateMarketplaceCategoryPayload>({});
  const [editSubcategoryInput, setEditSubcategoryInput] = useState("");
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<MarketplaceCategory | null>(null);

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

  // Create category mutation
  const createMutation = useMutation({
    mutationFn: createMarketplaceCategory,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category created successfully",
        variant: "success",
      });
      setIsCreateDialogOpen(false);
      // Reset form
      setFormData({
        name: "",
        type: "product",
        subcategories: [],
        description: "",
        imageUrl: "",
        icon: "",
      });
      setSubcategoryInput("");
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: ["marketplace-categories"] });
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
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMarketplaceCategoryPayload }) =>
      updateMarketplaceCategory(id, payload),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category updated successfully",
        variant: "success",
      });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      setEditFormData({});
      setEditSubcategoryInput("");
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: ["marketplace-categories"] });
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
    mutationFn: deleteMarketplaceCategory,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Category deleted successfully",
        variant: "success",
      });
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      // Invalidate and refetch categories
      queryClient.invalidateQueries({ queryKey: ["marketplace-categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add subcategory from input
  const addSubcategory = () => {
    const trimmed = subcategoryInput.trim();
    if (trimmed && !formData.subcategories.includes(trimmed)) {
      setFormData({
        ...formData,
        subcategories: [...formData.subcategories, trimmed],
      });
      setSubcategoryInput("");
    }
  };

  // Remove subcategory
  const removeSubcategory = (index: number) => {
    const newSubcategories = formData.subcategories.filter((_, i) => i !== index);
    setFormData({ ...formData, subcategories: newSubcategories });
  };

  // Handle Enter key in subcategory input
  const handleSubcategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubcategory();
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    // Validate subcategories
    if (formData.subcategories.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one subcategory is required",
        variant: "destructive",
      });
      return;
    }

    // Prepare payload (only include optional fields if they have values)
    const payload: CreateMarketplaceCategoryPayload = {
      name: formData.name.trim(),
      type: formData.type,
      subcategories: formData.subcategories,
    };

    if (formData.description?.trim()) {
      payload.description = formData.description.trim();
    }
    if (formData.imageUrl?.trim()) {
      payload.imageUrl = formData.imageUrl.trim();
    }
    if (formData.icon?.trim()) {
      payload.icon = formData.icon.trim();
    }

    createMutation.mutate(payload);
  };

  // Handle edit form submission
  const handleEditSubmit = () => {
    if (!editingCategory) return;

    // Build payload with only changed fields
    const payload: UpdateMarketplaceCategoryPayload = {};
    
    if (editFormData.name !== undefined && editFormData.name.trim() !== editingCategory.name) {
      payload.name = editFormData.name.trim();
    }
    if (editFormData.type !== undefined && editFormData.type !== editingCategory.type) {
      payload.type = editFormData.type;
    }
    if (editFormData.subcategories !== undefined && 
        JSON.stringify(editFormData.subcategories) !== JSON.stringify(editingCategory.subcategories)) {
      payload.subcategories = editFormData.subcategories;
    }
    if (editFormData.description !== undefined && editFormData.description.trim() !== (editingCategory.description || "")) {
      payload.description = editFormData.description.trim();
    }
    if (editFormData.imageUrl !== undefined && editFormData.imageUrl.trim() !== (editingCategory.imageUrl || "")) {
      payload.imageUrl = editFormData.imageUrl.trim();
    }
    if (editFormData.icon !== undefined && editFormData.icon.trim() !== (editingCategory.icon || "")) {
      payload.icon = editFormData.icon.trim();
    }

    // Check if there are any changes
    if (Object.keys(payload).length === 0) {
      toast({
        title: "No Changes",
        description: "No changes were made to the category",
      });
      return;
    }

    updateMutation.mutate({ id: editingCategory.id, payload });
  };

  // Open edit dialog with category data
  const handleEdit = (category: MarketplaceCategory) => {
    setEditingCategory(category);
    setEditFormData({
      name: category.name,
      type: category.type,
      subcategories: [...category.subcategories],
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      icon: category.icon || "",
    });
    setEditSubcategoryInput("");
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (category: MarketplaceCategory) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    if (deletingCategory) {
      deleteMutation.mutate(deletingCategory.id);
    }
  };

  // Edit subcategory handlers
  const addEditSubcategory = () => {
    const trimmed = editSubcategoryInput.trim();
    const currentSubcategories = editFormData.subcategories || [];
    if (trimmed && !currentSubcategories.includes(trimmed)) {
      setEditFormData({
        ...editFormData,
        subcategories: [...currentSubcategories, trimmed],
      });
      setEditSubcategoryInput("");
    }
  };

  const removeEditSubcategory = (index: number) => {
    const currentSubcategories = editFormData.subcategories || [];
    const newSubcategories = currentSubcategories.filter((_, i) => i !== index);
    setEditFormData({ ...editFormData, subcategories: newSubcategories });
  };

  const handleEditSubcategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEditSubcategory();
    }
  };

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
        <Button onClick={() => setIsCreateDialogOpen(true)} className="sm:ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Category
        </Button>
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
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
                            <AvatarFallback className="bg-primary/10 text-primary text-lg">{category.icon}</AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary"><ImageIcon className="h-5 w-5" /></AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{category.name}</p>
                          {category.description && <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>}
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
                        <span className="text-sm text-foreground capitalize">{category.type}</span>
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
                                  <li key={index} className="text-sm text-muted-foreground">• {subcategory}</li>
                                ))}
                              </ul>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <span className="text-sm text-muted-foreground">No subcategories</span>
                      )}
                    </td>
                    <td><p className="text-sm text-foreground">{formatDate(category.createdAt)}</p></td>
                    <td className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(category)} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(category)} className="text-destructive focus:text-destructive cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border">
            {categories.map((category) => (
              <div key={category.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      {category.imageUrl ? (
                        <AvatarImage src={category.imageUrl} alt={category.name} />
                      ) : category.icon ? (
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">{category.icon}</AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary"><ImageIcon className="h-5 w-5" /></AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{category.name}</p>
                      {category.description && <p className="text-xs text-muted-foreground line-clamp-1">{category.description}</p>}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)} className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(category)} className="text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    {category.type === "product" ? <Package className="h-4 w-4 text-blue-600" /> : <Briefcase className="h-4 w-4 text-green-600" />}
                    <span className="capitalize text-foreground">{category.type}</span>
                  </div>
                  {category.subcategories.length > 0 ? (
                    <span className="text-xs text-muted-foreground">{category.subcategories.length} subcategories</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No subcategories</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(category.createdAt)}</p>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1}–{Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of {paginationMeta.total} categories
              </div>
              <div className="pagination-controls">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!paginationMeta.hasPrevPage || isLoading}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {paginationMeta.page} of {paginationMeta.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!paginationMeta.hasNextPage || isLoading}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Marketplace Category</DialogTitle>
            <DialogDescription>
              Add a new category for marketplace products or services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Beauty & Wellness"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "product" | "service") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subcategories */}
            <div className="space-y-2">
              <Label>
                Subcategories <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {/* Input for adding new subcategory */}
                <div className="flex items-center gap-2">
                  <Input
                    value={subcategoryInput}
                    onChange={(e) => setSubcategoryInput(e.target.value)}
                    onKeyDown={handleSubcategoryKeyDown}
                    placeholder="Type subcategory and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addSubcategory}
                    disabled={!subcategoryInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {/* Display chips for added subcategories */}
                {formData.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.subcategories.map((subcategory, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1.5 pr-1 bg-gray-200 dark:bg-gray-700 text-foreground"
                      >
                        {subcategory}
                        <button
                          type="button"
                          onClick={() => removeSubcategory(index)}
                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                At least one subcategory is required
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description (optional)"
                rows={3}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="icon">Icon URL</Label>
              <Input
                id="icon"
                type="url"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="https://example.com/icon.png or icon identifier"
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
              {createMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Marketplace Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="e.g., Beauty & Wellness"
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                value={editFormData.type || "product"}
                onValueChange={(value: "product" | "service") =>
                  setEditFormData({ ...editFormData, type: value })
                }
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subcategories */}
            <div className="space-y-2">
              <Label>Subcategories</Label>
              <div className="space-y-2">
                {/* Input for adding new subcategory */}
                <div className="flex items-center gap-2">
                  <Input
                    value={editSubcategoryInput}
                    onChange={(e) => setEditSubcategoryInput(e.target.value)}
                    onKeyDown={handleEditSubcategoryKeyDown}
                    placeholder="Type subcategory and press Enter"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addEditSubcategory}
                    disabled={!editSubcategoryInput.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {/* Display chips for added subcategories */}
                {(editFormData.subcategories && editFormData.subcategories.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {editFormData.subcategories.map((subcategory, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1.5 pr-1 bg-gray-200 dark:bg-gray-700 text-foreground"
                      >
                        {subcategory}
                        <button
                          type="button"
                          onClick={() => removeEditSubcategory(index)}
                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description || ""}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Category description (optional)"
                rows={3}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="edit-imageUrl">Image URL</Label>
              <Input
                id="edit-imageUrl"
                type="url"
                value={editFormData.imageUrl || ""}
                onChange={(e) => setEditFormData({ ...editFormData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon URL</Label>
              <Input
                id="edit-icon"
                type="url"
                value={editFormData.icon || ""}
                onChange={(e) => setEditFormData({ ...editFormData, icon: e.target.value })}
                placeholder="https://example.com/icon.png or icon identifier"
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
              Are you sure you want to delete the category "{deletingCategory?.name}"? This action cannot be undone.
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
