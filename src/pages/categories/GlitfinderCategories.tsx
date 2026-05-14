import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Compass, Plus, Edit, Trash2, GripVertical, ImageIcon, X } from "lucide-react";
import {
  PageHeader,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getGlitfinderCategories,
  createGlitfinderCategory,
  updateGlitfinderCategory,
  deleteGlitfinderCategory,
  type CreateGlitfinderCategoryPayload,
  type UpdateGlitfinderCategoryPayload,
} from "@/services/glitfinderCategoriesApi";
import type { GlitfinderCategory } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

const emptyCreate: CreateGlitfinderCategoryPayload = {
  name: "",
  subcategories: [],
  description: "",
  imageUrl: "",
  icon: "",
  order: 0,
};

export default function GlitfinderCategoriesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateGlitfinderCategoryPayload>(emptyCreate);
  const [subcategoryInput, setSubcategoryInput] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<GlitfinderCategory | null>(null);
  const [editForm, setEditForm] = useState<UpdateGlitfinderCategoryPayload>({});
  const [editSubcategoryInput, setEditSubcategoryInput] = useState("");

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCat, setDeletingCat] = useState<GlitfinderCategory | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["glitfinder-categories"],
    queryFn: getGlitfinderCategories,
    retry: 1,
  });

  const categories: GlitfinderCategory[] = (data?.data?.categories || []).map((c) => {
    const row = c as GlitfinderCategory & { _id?: string };
    return {
      ...c,
      id: c.id || row._id || "",
      subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
    };
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading categories",
        description: error instanceof Error ? error.message : "Failed to fetch Glitfinder categories",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const createMutation = useMutation({
    mutationFn: createGlitfinderCategory,
    onSuccess: () => {
      toast({ title: "Category created", variant: "success" });
      setIsCreateOpen(false);
      setCreateForm(emptyCreate);
      setSubcategoryInput("");
      queryClient.invalidateQueries({ queryKey: ["glitfinder-categories"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating category", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGlitfinderCategoryPayload }) =>
      updateGlitfinderCategory(id, payload),
    onSuccess: () => {
      toast({ title: "Category updated", variant: "success" });
      setIsEditOpen(false);
      setEditingCat(null);
      setEditForm({});
      setEditSubcategoryInput("");
      queryClient.invalidateQueries({ queryKey: ["glitfinder-categories"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating category", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGlitfinderCategory,
    onSuccess: () => {
      toast({ title: "Category deleted", variant: "success" });
      setIsDeleteOpen(false);
      setDeletingCat(null);
      queryClient.invalidateQueries({ queryKey: ["glitfinder-categories"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error deleting category", description: err.message, variant: "destructive" });
    },
  });

  const addSubcategory = () => {
    const trimmed = subcategoryInput.trim();
    if (trimmed && !createForm.subcategories.includes(trimmed)) {
      setCreateForm({
        ...createForm,
        subcategories: [...createForm.subcategories, trimmed],
      });
      setSubcategoryInput("");
    }
  };

  const removeSubcategory = (index: number) => {
    setCreateForm({
      ...createForm,
      subcategories: createForm.subcategories.filter((_, i) => i !== index),
    });
  };

  const handleSubcategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSubcategory();
    }
  };

  const addEditSubcategory = () => {
    const trimmed = editSubcategoryInput.trim();
    const current = editForm.subcategories || [];
    if (trimmed && !current.includes(trimmed)) {
      setEditForm({ ...editForm, subcategories: [...current, trimmed] });
      setEditSubcategoryInput("");
    }
  };

  const removeEditSubcategory = (index: number) => {
    const current = editForm.subcategories || [];
    setEditForm({
      ...editForm,
      subcategories: current.filter((_, i) => i !== index),
    });
  };

  const handleEditSubcategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEditSubcategory();
    }
  };

  const handleCreate = () => {
    if (!createForm.name.trim()) {
      toast({ title: "Validation", description: "Name is required", variant: "destructive" });
      return;
    }
    if (createForm.subcategories.length === 0) {
      toast({
        title: "Validation",
        description: "At least one subcategory is required",
        variant: "destructive",
      });
      return;
    }
    const payload: CreateGlitfinderCategoryPayload = {
      name: createForm.name.trim(),
      subcategories: createForm.subcategories,
    };
    if (createForm.description?.trim()) payload.description = createForm.description.trim();
    if (createForm.imageUrl?.trim()) payload.imageUrl = createForm.imageUrl.trim();
    if (createForm.icon?.trim()) payload.icon = createForm.icon.trim();
    if (createForm.order !== undefined) payload.order = createForm.order;
    createMutation.mutate(payload);
  };

  const handleEdit = (cat: GlitfinderCategory) => {
    setEditingCat(cat);
    setEditForm({
      name: cat.name,
      description: cat.description ?? "",
      imageUrl: cat.imageUrl ?? "",
      icon: cat.icon ?? "",
      order: cat.order,
      subcategories: [...cat.subcategories],
    });
    setEditSubcategoryInput("");
    setIsEditOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingCat) return;
    if (editForm.name !== undefined && !editForm.name.trim()) {
      toast({ title: "Validation", description: "Name cannot be empty", variant: "destructive" });
      return;
    }
    const payload: UpdateGlitfinderCategoryPayload = {};
    if (editForm.name?.trim() !== editingCat.name) payload.name = editForm.name?.trim();
    if ((editForm.description ?? "") !== (editingCat.description ?? "")) payload.description = editForm.description;
    if ((editForm.imageUrl ?? "") !== (editingCat.imageUrl ?? "")) payload.imageUrl = editForm.imageUrl;
    if ((editForm.icon ?? "") !== (editingCat.icon ?? "")) payload.icon = editForm.icon;
    if (editForm.order !== editingCat.order) payload.order = editForm.order;
    if (
      editForm.subcategories !== undefined &&
      JSON.stringify(editForm.subcategories) !== JSON.stringify(editingCat.subcategories)
    ) {
      payload.subcategories = editForm.subcategories;
    }

    if (Object.keys(payload).length === 0) {
      toast({ title: "No changes", description: "Nothing was modified" });
      return;
    }
    updateMutation.mutate({ id: editingCat.id, payload });
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const isUrl = (str: string) => /^https?:\/\//i.test(str);

  const renderIcon = (icon: string | undefined, size: "sm" | "md" = "sm") => {
    if (!icon) return <span className="text-muted-foreground text-sm">—</span>;
    if (isUrl(icon)) {
      const dim = size === "sm" ? "h-4 w-4" : "h-6 w-6";
      return (
        <img
          src={icon}
          alt="icon"
          className={`${dim} object-contain`}
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      );
    }
    return <span className="text-lg leading-none">{icon}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Glitfinder Discovery Categories"
        description="Manage discovery categories displayed in the Glitfinder section"
      />

      <div className="filter-bar">
        <Button onClick={() => setIsCreateOpen(true)} className="sm:ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton columns={8} rows={8} />
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Compass className="h-12 w-12" />}
            title="No categories found"
            description="Add your first Glitfinder discovery category to get started"
          />
        </div>
      ) : (
        <div className="card">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10 text-center">#</th>
                  <th>Name</th>
                  <th>Icon</th>
                  <th>Description</th>
                  <th>Subcategories</th>
                  <th>Order</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, idx) => (
                  <tr key={cat.id}>
                    <td className="text-center text-muted-foreground">{idx + 1}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {cat.imageUrl ? (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            className="h-8 w-8 rounded object-cover shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        ) : (
                          <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <p className="font-medium text-foreground">{cat.name}</p>
                      </div>
                    </td>
                    <td>{renderIcon(cat.icon, "md")}</td>
                    <td>
                      <p className="text-sm text-muted-foreground max-w-xs line-clamp-2">
                        {cat.description || <span className="text-muted-foreground">—</span>}
                      </p>
                    </td>
                    <td>
                      {cat.subcategories.length > 0 ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-sm text-foreground hover:text-primary cursor-pointer underline-offset-4 hover:underline"
                            >
                              {cat.subcategories.length}{" "}
                              {cat.subcategories.length === 1 ? "subcategory" : "subcategories"}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-3" align="start">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-foreground mb-2">Subcategories</h4>
                              <ul className="space-y-1">
                                {cat.subcategories.map((sub, index) => (
                                  <li key={index} className="text-sm text-muted-foreground">
                                    • {sub}
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
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {cat.order}
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-foreground">{formatDate(cat.createdAt)}</p>
                    </td>
                    <td className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(cat)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => { setDeletingCat(cat); setIsDeleteOpen(true); }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-border">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="h-10 w-10 rounded object-cover shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">#{idx + 1} · Order {cat.order}</p>
                      <p className="font-medium text-foreground truncate">{cat.name}</p>
                      {cat.icon && renderIcon(cat.icon, "sm")}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(cat)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { setDeletingCat(cat); setIsDeleteOpen(true); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {cat.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{cat.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  {cat.subcategories.length > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {cat.subcategories.length}{" "}
                      {cat.subcategories.length === 1 ? "subcategory" : "subcategories"}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No subcategories</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(cat.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) { setCreateForm(emptyCreate); setSubcategoryInput(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Discovery Category</DialogTitle>
            <DialogDescription>Create a new Glitfinder discovery category</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="c-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g. Hair & Beauty"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Subcategories <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
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
                {createForm.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {createForm.subcategories.map((sub, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1.5 pr-1 bg-gray-200 dark:bg-gray-700 text-foreground"
                      >
                        {sub}
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
              <p className="text-xs text-muted-foreground">At least one subcategory is required</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-icon">Icon</Label>
              <Input
                id="c-icon"
                value={createForm.icon ?? ""}
                onChange={(e) => setCreateForm({ ...createForm, icon: e.target.value })}
                placeholder="e.g. scissors"
              />
              <p className="text-xs text-muted-foreground">Icon name used by the app (e.g. a Lucide icon slug).</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-image">Image URL</Label>
              <Input
                id="c-image"
                value={createForm.imageUrl ?? ""}
                onChange={(e) => setCreateForm({ ...createForm, imageUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea
                id="c-desc"
                value={createForm.description ?? ""}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-order">Display Order</Label>
              <Input
                id="c-order"
                type="number"
                min={0}
                value={createForm.order ?? 0}
                onChange={(e) => setCreateForm({ ...createForm, order: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setCreateForm(emptyCreate); setSubcategoryInput(""); }} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) { setEditingCat(null); setEditForm({}); setEditSubcategoryInput(""); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update name, subcategories, icon, image, description, or display order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="e-name">Name</Label>
              <Input
                id="e-name"
                value={editForm.name ?? ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subcategories</Label>
              <div className="space-y-2">
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
                {(editForm.subcategories && editForm.subcategories.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {editForm.subcategories.map((sub, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1.5 pr-1 bg-gray-200 dark:bg-gray-700 text-foreground"
                      >
                        {sub}
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
            <div className="space-y-2">
              <Label htmlFor="e-icon">Icon</Label>
              <Input
                id="e-icon"
                value={editForm.icon ?? ""}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                placeholder="e.g. scissors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-image">Image URL</Label>
              <Input
                id="e-image"
                value={editForm.imageUrl ?? ""}
                onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                placeholder="https://..."
              />
              {editForm.imageUrl && (
                <img
                  src={editForm.imageUrl}
                  alt="preview"
                  className="mt-1 h-16 w-16 rounded object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-desc">Description</Label>
              <Textarea
                id="e-desc"
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-order">Display Order</Label>
              <Input
                id="e-order"
                type="number"
                min={0}
                value={editForm.order ?? 0}
                onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingCat(null); setEditForm({}); setEditSubcategoryInput(""); }} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(o) => { setIsDeleteOpen(o); if (!o) setDeletingCat(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>"{deletingCat?.name}"</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeletingCat(null); }} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingCat && deleteMutation.mutate(deletingCat.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
