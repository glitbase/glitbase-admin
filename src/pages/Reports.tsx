import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Eye, Flag, User, Store, Package, Briefcase, Star, Sparkles, Calendar, FileText, Edit } from "lucide-react";
import {
  PageHeader,
  FilterSelect,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getReports, updateReportStatus, type GetReportsParams, type UpdateReportStatusParams } from "@/services/reportsApi";
import type { Report } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ReportsPage() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [reviewNote, setReviewNote] = useState<string>("");
  const limit = 20;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  // Build query params
  const queryParams: GetReportsParams = useMemo(() => {
    const params: GetReportsParams = {
      page,
      limit,
    };

    if (typeFilter !== "all") {
      params.type = typeFilter as "user" | "store" | "product" | "service" | "review" | "glit";
    }

    if (statusFilter !== "all") {
      params.status = statusFilter as "pending" | "reviewing" | "resolved" | "dismissed";
    }

    return params;
  }, [typeFilter, statusFilter, page, limit]);

  // Fetch reports
  const {
    data: reportsResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["reports", queryParams],
    queryFn: () => getReports(queryParams),
    retry: 1,
  });

  // Update report status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: UpdateReportStatusParams }) =>
      updateReportStatus(id, params),
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "Report status has been updated successfully",
      });
      setIsStatusDialogOpen(false);
      setNewStatus("");
      setReviewNote("");
      // Refetch reports
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update report status",
        variant: "destructive",
      });
    },
  });

  // Parse dates from API response (dates come as strings from JSON)
  const reports = useMemo(() => {
    return (reportsResponse?.data?.docs || []).map((report) => ({
      ...report,
      createdAt: new Date(report.createdAt),
      updatedAt: new Date(report.updatedAt),
      reviewedAt: report.reviewedAt ? new Date(report.reviewedAt) : undefined,
    }));
  }, [reportsResponse?.data?.docs]);

  // Handle pagination meta
  const paginationMeta = useMemo(() => {
    const meta = reportsResponse?.data?.meta;
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
  }, [reportsResponse?.data?.meta]);

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading reports",
        description: error instanceof Error ? error.message : "Failed to fetch reports",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const typeOptions = [
    { value: "user", label: "User" },
    { value: "store", label: "Store" },
    { value: "product", label: "Product" },
    { value: "service", label: "Service" },
    { value: "review", label: "Review" },
    { value: "glit", label: "Glit" },
  ];

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "reviewing", label: "Reviewing" },
    { value: "resolved", label: "Resolved" },
    { value: "dismissed", label: "Dismissed" },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="h-4 w-4 text-blue-600" />;
      case "store":
        return <Store className="h-4 w-4 text-green-600" />;
      case "product":
        return <Package className="h-4 w-4 text-purple-600" />;
      case "service":
        return <Briefcase className="h-4 w-4 text-orange-600" />;
      case "review":
        return <Star className="h-4 w-4 text-yellow-600" />;
      case "glit":
        return <Sparkles className="h-4 w-4 text-pink-600" />;
      default:
        return <Flag className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        title="Reports"
        description="View and resolve user reports"
      />

      <div className="filter-bar">
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="Report Type"
          options={typeOptions}
          allLabel="All Types"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Statuses"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} rows={10} />
      ) : reports.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Flag className="h-12 w-12" />}
            title="No reports found"
            description={
              typeFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Reports will appear here once users submit them"
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
                  <th>Reporter</th>
                  <th>Target Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(`${report.reporter.firstName} ${report.reporter.lastName}`)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">{report.reporter.firstName} {report.reporter.lastName}</p>
                          <p className="text-xs text-muted-foreground">{report.reporter.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(report.type)}
                        <span className="text-sm text-foreground capitalize">{report.type}</span>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm text-foreground font-medium">{report.title}</p>
                      {report.description && <p className="text-xs text-muted-foreground line-clamp-1">{report.description}</p>}
                    </td>
                    <td><StatusBadge status={report.status} /></td>
                    <td>
                      <p className="text-sm text-foreground">{formatDate(report.createdAt)}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(report.createdAt).split(", ")[1]}</p>
                    </td>
                    <td className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedReport(report); setIsSheetOpen(true); }} className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedReport(report); setNewStatus(report.status); setReviewNote(report.reviewNote || ""); setIsStatusDialogOpen(true); }} className="cursor-pointer">
                            <Edit className="h-4 w-4 mr-2" />Update Status
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
            {reports.map((report) => (
              <div key={report.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(`${report.reporter.firstName} ${report.reporter.lastName}`)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">{report.reporter.firstName} {report.reporter.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{report.reporter.email}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelectedReport(report); setIsSheetOpen(true); }} className="cursor-pointer">
                        <Eye className="h-4 w-4 mr-2" />View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setSelectedReport(report); setNewStatus(report.status); setReviewNote(report.reviewNote || ""); setIsStatusDialogOpen(true); }} className="cursor-pointer">
                        <Edit className="h-4 w-4 mr-2" />Update Status
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{report.title}</p>
                  {report.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{report.description}</p>}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(report.type)}
                    <span className="text-xs text-muted-foreground capitalize">{report.type}</span>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
                <p className="text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1}–{Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of {paginationMeta.total} reports
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

      {/* Report Details Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl h-auto overflow-y-auto m-3 rounded-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Report Details
            </SheetTitle>
            <SheetDescription>
              View complete information about the report
            </SheetDescription>
          </SheetHeader>

          {selectedReport && (
            <div className="space-y-6 py-4">
              {/* Reporter Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Reporter Information
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(`${selectedReport.reporter.firstName} ${selectedReport.reporter.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {selectedReport.reporter.firstName} {selectedReport.reporter.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedReport.reporter.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {selectedReport.reporter.id}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Report Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Report Type
                    </label>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(selectedReport.type)}
                      <p className="text-sm text-foreground capitalize">
                        {selectedReport.type}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Status
                    </label>
                    <div>
                      <StatusBadge status={selectedReport.status} />
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Target ID
                    </label>
                    <p className="text-sm text-foreground font-mono">
                      {selectedReport.targetId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Report Content */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Report Content
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Title
                    </label>
                    <p className="text-sm font-medium text-foreground">
                      {selectedReport.title}
                    </p>
                  </div>

                  {selectedReport.description && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Description
                      </label>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedReport.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Information */}
              {selectedReport.reviewedBy && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                    Review Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Reviewed By
                      </label>
                      <p className="text-sm text-foreground">
                        {selectedReport.reviewedBy.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ID: {selectedReport.reviewedBy.id}
                      </p>
                    </div>

                    {selectedReport.reviewedAt && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">
                          Reviewed At
                        </label>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm text-foreground">
                            {formatDateTime(selectedReport.reviewedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedReport.reviewNote && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">
                        Review Note
                      </label>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                        {selectedReport.reviewNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                  Timestamps
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Created At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedReport.createdAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedReport.createdAt).split(", ")[1]}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Updated At
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-foreground">
                          {formatDate(selectedReport.updatedAt)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(selectedReport.updatedAt).split(", ")[1]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Update Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Report Status</DialogTitle>
            <DialogDescription>
              Change the status of this report
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Current Status
                </label>
                <div>
                  <StatusBadge status={selectedReport.status} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  New Status
                </label>
                <Select
                  value={newStatus || selectedReport.status}
                  onValueChange={setNewStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Review Note <span className="text-xs text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add a note about this status update..."
                  className="min-h-[100px] resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {reviewNote.length}/1000 characters
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsStatusDialogOpen(false);
                setNewStatus("");
                setReviewNote("");
              }}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedReport && newStatus && newStatus !== selectedReport.status) {
                  const params: UpdateReportStatusParams = {
                    status: newStatus as "pending" | "reviewing" | "resolved" | "dismissed",
                  };
                  
                  if (reviewNote.trim()) {
                    params.reviewNote = reviewNote.trim();
                  }

                  updateStatusMutation.mutate({
                    id: selectedReport.id,
                    params,
                  });
                } else {
                  toast({
                    title: "No changes",
                    description: "Please select a different status",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!newStatus || newStatus === selectedReport?.status || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

