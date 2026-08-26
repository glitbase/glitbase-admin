import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Plus, Eye, MoreHorizontal } from "lucide-react";
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
import { getAnnouncements, type GetAnnouncementsParams } from "@/services/announcementsApi";
import type { Announcement } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { normalizePaginationMeta } from "@/lib/paginationUtils";
import { CreateAnnouncementSheet } from "@/components/announcements/CreateAnnouncementSheet";
import { AnnouncementDetailSheet } from "@/components/announcements/AnnouncementDetailSheet";

function formatAudience(audience: Announcement["audience"]) {
  return audience
    .map((item) => (item === "customers" ? "Customers" : "Providers"))
    .join(", ");
}

function formatChannels(channels: Announcement["channels"]) {
  return channels
    .map((channel) => {
      if (channel === "in_app") return "In-app";
      return channel.charAt(0).toUpperCase() + channel.slice(1);
    })
    .join(", ");
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const limit = 20;

  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  const queryParams: GetAnnouncementsParams = useMemo(() => {
    const params: GetAnnouncementsParams = { page, limit };
    if (typeFilter !== "all") params.type = typeFilter as GetAnnouncementsParams["type"];
    if (statusFilter !== "all") params.status = statusFilter as GetAnnouncementsParams["status"];
    return params;
  }, [typeFilter, statusFilter, page, limit]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["announcements", queryParams],
    queryFn: () => getAnnouncements(queryParams),
    retry: 1,
    refetchInterval: (query) => {
      const rows = query.state.data?.data?.announcements ?? [];
      return rows.some((row) => row.status === "sending") ? 5000 : false;
    },
  });

  const announcements = useMemo(() => {
    return (data?.data?.announcements || []).map((row) => ({
      ...row,
      id: row.id || (row as Announcement & { _id?: string })._id || "",
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    }));
  }, [data?.data?.announcements]);

  const paginationMeta = useMemo(
    () => normalizePaginationMeta(data?.data?.meta, limit),
    [data?.data?.meta, limit]
  );

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading announcements",
        description: error instanceof Error ? error.message : "Failed to fetch announcements",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const typeOptions = [
    { value: "announcement", label: "Announcement" },
    { value: "update", label: "Update" },
    { value: "promotion", label: "Promotion" },
  ];

  const statusOptions = [
    { value: "sending", label: "Sending" },
    { value: "sent", label: "Sent" },
    { value: "failed", label: "Failed" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Announcements"
        description="Send broadcasts to customers and providers via email, in-app, and push"
        action={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New broadcast
          </Button>
        }
      />

      <div className="filter-bar flex-wrap">
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="Type"
          options={typeOptions}
          allLabel="All types"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All statuses"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} rows={8} />
      ) : announcements.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No announcements yet"
            description="Send your first broadcast to customers or providers"
            icon={<Megaphone className="h-6 w-6" />}
          />
        </div>
      ) : (
        <div className="card">
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Audience</th>
                  <th>Channels</th>
                  <th>Recipients</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => (
                  <tr key={announcement.id}>
                    <td>
                      <p className="font-medium text-foreground">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 max-w-[280px]">
                        {announcement.body}
                      </p>
                    </td>
                    <td>
                      <StatusBadge status={announcement.type} />
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {formatAudience(announcement.audience)}
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {formatChannels(announcement.channels)}
                    </td>
                    <td>{announcement.recipientCount.toLocaleString()}</td>
                    <td>
                      <StatusBadge status={announcement.status} />
                    </td>
                    <td className="text-muted-foreground">
                      {announcement.sentAt ? formatDate(announcement.sentAt) : "—"}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => setSelectedAnnouncement(announcement)}
                          >
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
          </div>

          <div className="md:hidden divide-y divide-border">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {announcement.body}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={announcement.type} />
                  <StatusBadge status={announcement.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatAudience(announcement.audience)} · {formatChannels(announcement.channels)}{" "}
                  · {announcement.recipientCount.toLocaleString()} recipients
                </p>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {(paginationMeta.page - 1) * paginationMeta.limit + 1}–
                {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                {paginationMeta.total} announcements
              </div>
              <div className="pagination-controls">
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

      <CreateAnnouncementSheet open={createOpen} onOpenChange={setCreateOpen} />

      <AnnouncementDetailSheet
        open={Boolean(selectedAnnouncement)}
        onOpenChange={(open) => !open && setSelectedAnnouncement(null)}
        announcementId={selectedAnnouncement?.id ?? null}
        preview={selectedAnnouncement}
      />
    </div>
  );
}
