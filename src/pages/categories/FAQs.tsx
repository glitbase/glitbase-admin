import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, HelpCircle, Plus, Edit, Trash2, GripVertical } from "lucide-react";
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
import {
  getFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  type CreateFAQPayload,
  type UpdateFAQPayload,
} from "@/services/faqsApi";
import type { FAQ } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

const emptyForm: CreateFAQPayload = { question: "", answer: "", order: 0 };

export default function FAQsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFAQPayload>(emptyForm);

  // Edit dialog
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [editForm, setEditForm] = useState<UpdateFAQPayload>({});

  // Delete dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<FAQ | null>(null);

  // Fetch
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["faqs"],
    queryFn: getFAQs,
    retry: 1,
  });

  const faqs: FAQ[] = (Array.isArray(data?.data) ? data.data : []).map((f) => ({
    ...f,
    id: f.id || (f as any)._id,
  }));

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading FAQs",
        description: error instanceof Error ? error.message : "Failed to fetch FAQs",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createFAQ,
    onSuccess: () => {
      toast({ title: "FAQ created", variant: "success" });
      setIsCreateOpen(false);
      setCreateForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating FAQ", description: err.message, variant: "destructive" });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateFAQPayload }) =>
      updateFAQ(id, payload),
    onSuccess: () => {
      toast({ title: "FAQ updated", variant: "success" });
      setIsEditOpen(false);
      setEditingFaq(null);
      setEditForm({});
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating FAQ", description: err.message, variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFAQ,
    onSuccess: () => {
      toast({ title: "FAQ deleted", variant: "success" });
      setIsDeleteOpen(false);
      setDeletingFaq(null);
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (err: Error) => {
      toast({ title: "Error deleting FAQ", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!createForm.question.trim()) {
      toast({ title: "Validation", description: "Question is required", variant: "destructive" });
      return;
    }
    if (!createForm.answer.trim()) {
      toast({ title: "Validation", description: "Answer is required", variant: "destructive" });
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setEditForm({ question: faq.question, answer: faq.answer, order: faq.order });
    setIsEditOpen(true);
  };

  const handleEditSubmit = () => {
    if (!editingFaq) return;
    if (editForm.question !== undefined && !editForm.question.trim()) {
      toast({ title: "Validation", description: "Question cannot be empty", variant: "destructive" });
      return;
    }
    if (editForm.answer !== undefined && !editForm.answer.trim()) {
      toast({ title: "Validation", description: "Answer cannot be empty", variant: "destructive" });
      return;
    }
    updateMutation.mutate({ id: editingFaq.id, payload: editForm });
  };

  const handleDeleteClick = (faq: FAQ) => {
    setDeletingFaq(faq);
    setIsDeleteOpen(true);
  };

  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Policies / FAQs" description="Manage frequently asked questions shown in the app" />

      <div className="filter-bar">
        <Button onClick={() => setIsCreateOpen(true)} className="sm:ml-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton columns={4} rows={8} />
      ) : faqs.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<HelpCircle className="h-12 w-12" />}
            title="No FAQs found"
            description="Add your first FAQ to get started"
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
                  <th>Question</th>
                  <th>Answer</th>
                  <th>Order</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq, idx) => (
                  <tr key={faq.id}>
                    <td className="text-center text-muted-foreground">{idx + 1}</td>
                    <td>
                      <p className="font-medium text-foreground max-w-xs line-clamp-2">{faq.question}</p>
                    </td>
                    <td>
                      <p className="text-sm text-muted-foreground max-w-sm line-clamp-2">{faq.answer}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        {faq.order}
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-foreground">{formatDate(faq.createdAt)}</p>
                    </td>
                    <td className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(faq)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(faq)}
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
            {faqs.map((faq, idx) => (
              <div key={faq.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-0.5">#{idx + 1} · Order {faq.order}</p>
                    <p className="font-medium text-foreground leading-snug">{faq.question}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(faq)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(faq)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{faq.answer}</p>
                <p className="text-xs text-muted-foreground">{formatDate(faq.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create FAQ Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) setCreateForm(emptyForm); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add FAQ</DialogTitle>
            <DialogDescription>Create a new frequently asked question</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-question">
                Question <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-question"
                value={createForm.question}
                onChange={(e) => setCreateForm({ ...createForm, question: e.target.value })}
                placeholder="e.g. How do I cancel my subscription?"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-answer">
                Answer <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="create-answer"
                value={createForm.answer}
                onChange={(e) => setCreateForm({ ...createForm, answer: e.target.value })}
                placeholder="Provide a clear, helpful answer..."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-order">Display Order</Label>
              <Input
                id="create-order"
                type="number"
                min={0}
                value={createForm.order ?? 0}
                onChange={(e) => setCreateForm({ ...createForm, order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">Lower numbers appear first. Defaults to 0.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); setCreateForm(emptyForm); }} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create FAQ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(o) => { setIsEditOpen(o); if (!o) { setEditingFaq(null); setEditForm({}); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>Update the question, answer, or display order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-question">Question</Label>
              <Input
                id="edit-question"
                value={editForm.question ?? ""}
                onChange={(e) => setEditForm({ ...editForm, question: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-answer">Answer</Label>
              <Textarea
                id="edit-answer"
                value={editForm.answer ?? ""}
                onChange={(e) => setEditForm({ ...editForm, answer: e.target.value })}
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-order">Display Order</Label>
              <Input
                id="edit-order"
                type="number"
                min={0}
                value={editForm.order ?? 0}
                onChange={(e) => setEditForm({ ...editForm, order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingFaq(null); setEditForm({}); }} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={(o) => { setIsDeleteOpen(o); if (!o) setDeletingFaq(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete FAQ</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>"{deletingFaq?.question}"</strong>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setDeletingFaq(null); }} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingFaq && deleteMutation.mutate(deletingFaq.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
