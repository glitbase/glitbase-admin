import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Eye, MoreHorizontal } from "lucide-react";
import {
  PageHeader,
  SearchInput,
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
import { getWaitlistEntries, type GetWaitlistParams } from "@/services/waitlistApi";
import type { WaitlistEntry } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { normalizePaginationMeta } from "@/lib/paginationUtils";
import { WaitlistDetailSheet } from "@/components/waitlist/WaitlistDetailSheet";

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatUserType(userType: WaitlistEntry["userType"]) {
  return userType === "vendor" ? "Provider" : "Customer";
}

function normalizeEntry(row: WaitlistEntry & { _id?: string }) {
  return {
    ...row,
    id: row.id || row._id || "",
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    socialMedia: row.socialMedia ?? [],
  };
}

export default function WaitlistPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const limit = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    setPage(1);
  }, [userTypeFilter]);

  const queryParams: GetWaitlistParams = useMemo(() => {
    const params: GetWaitlistParams = { page, limit };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (userTypeFilter !== "all") {
      params.userType = userTypeFilter as GetWaitlistParams["userType"];
    }

    return params;
  }, [debouncedSearch, userTypeFilter, page, limit]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["waitlist", queryParams],
    queryFn: () => getWaitlistEntries(queryParams),
    retry: 1,
  });

  const entries = useMemo(() => {
    return (data?.data?.entries || []).map(normalizeEntry);
  }, [data?.data?.entries]);

  const paginationMeta = useMemo(
    () => normalizePaginationMeta(data?.data?.meta, limit),
    [data?.data?.meta, limit]
  );

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading waitlist",
        description: error instanceof Error ? error.message : "Failed to fetch waitlist entries",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const userTypeOptions = [
    { value: "customer", label: "Customer" },
    { value: "vendor", label: "Provider" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Waitlist"
        description="View early-access signups from customers and providers"
      />

      <div className="filter-bar flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, email, business, or social…"
        />
        <FilterSelect
          value={userTypeFilter}
          onChange={setUserTypeFilter}
          placeholder="User type"
          options={userTypeOptions}
          allLabel="All types"
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={6} rows={10} />
      ) : entries.length === 0 ? (
        <div className="card">
          <EmptyState
            title="No waitlist entries found"
            description={
              search || userTypeFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Signups will appear here once people join the waitlist"
            }
            icon={<ClipboardList className="h-6 w-6" />}
          />
        </div>
      ) : (
        <div className="card">
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Business</th>
                  <th>Social</th>
                  <th>Joined</th>
                  <th className="w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <p className="font-medium text-foreground capitalize">{entry.name}</p>
                    </td>
                    <td>
                      <p className="text-sm text-muted-foreground">{entry.email}</p>
                    </td>
                    <td>
                      <StatusBadge status={entry.userType} />
                    </td>
                    <td>
                      <p className="text-sm text-muted-foreground">
                        {entry.userType === "vendor" ? entry.businessName || "—" : "—"}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm text-muted-foreground">
                        {entry.socialMedia.length > 0
                          ? `${entry.socialMedia.length} handle${entry.socialMedia.length === 1 ? "" : "s"}`
                          : "—"}
                      </p>
                    </td>
                    <td className="text-muted-foreground">{formatDate(entry.createdAt)}</td>
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
                            onClick={() => setSelectedEntry(entry)}
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
            {entries.map((entry) => (
              <div key={entry.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground capitalize">{entry.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                    {entry.businessName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.businessName}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                  <StatusBadge status={entry.userType} />
                  <span>{formatUserType(entry.userType)}</span>
                  <span>·</span>
                  <span>{formatDate(entry.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          {paginationMeta && paginationMeta.totalPages > 1 && (
            <div className="pagination-bar">
              <div className="pagination-info">
                Showing {(paginationMeta.page - 1) * paginationMeta.limit + 1}–
                {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                {paginationMeta.total} entries
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

      <WaitlistDetailSheet
        open={Boolean(selectedEntry)}
        onOpenChange={(open) => !open && setSelectedEntry(null)}
        entryId={selectedEntry?.id ?? null}
        preview={selectedEntry}
      />
    </div>
  );
}
