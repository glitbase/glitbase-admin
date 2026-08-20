import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Mail, Eye, Users as UsersIcon, Download, UserPlus, Link2 } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
  EmptyState,
  TableSkeleton,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getUsers, type GetUsersParams } from "@/services/usersApi";
import type { User, AccountSource } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { CreateUserSheet } from "@/components/users/CreateUserSheet";
import {
  CreateInviteSheet,
  InviteLinkBanner,
} from "@/components/users/CreateInviteSheet";
import { InvitesPanel } from "@/components/users/InvitesPanel";

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createInviteOpen, setCreateInviteOpen] = useState(false);
  const [pendingInviteUrl, setPendingInviteUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
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

  // Reset page when role filter changes
  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  // Build query params
  const queryParams: GetUsersParams = useMemo(() => {
    const params: GetUsersParams = {
      page,
      limit,
    };

    if (debouncedSearch) {
      params.searchTerm = debouncedSearch;
    }

    if (roleFilter !== "all") {
      params.role = roleFilter as "admin" | "vendor" | "customer";
    }

    return params;
  }, [debouncedSearch, roleFilter, page, limit]);

  // Fetch users
  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["users", queryParams],
    queryFn: () => getUsers(queryParams),
    retry: 1,
  });

  // Parse dates from API response (dates come as strings from JSON)
  const users = useMemo(() => {
    return (usersResponse?.data?.users || []).map((user) => ({
      ...user,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    }));
  }, [usersResponse?.data?.users]);

  const paginationMeta = usersResponse?.data?.meta;

  // Handle errors
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading users",
        description: error instanceof Error ? error.message : "Failed to fetch users",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  const roleOptions = [
    { value: "admin", label: "Admin" },
    { value: "vendor", label: "Vendor" },
    { value: "customer", label: "Customer" },
  ];

  const getInitials = (user: User) => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || user.email[0].toUpperCase();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatAccountSource = (source?: AccountSource) => {
    switch (source) {
      case "admin_created":
        return "Admin created";
      case "invite":
        return "Invite";
      case "self_registration":
        return "Self registered";
      default:
        return "—";
    }
  };

  const formatInvitedBy = (user: User) => {
    if (!user.invitedBy) return "—";
    const { firstName, lastName, email } = user.invitedBy;
    if (firstName || lastName) {
      return `${firstName ?? ""} ${lastName ?? ""}`.trim();
    }
    return email;
  };

  const exportUsers = async () => {
    try {
      // Fetch all users for export (without pagination)
      const exportParams: GetUsersParams = {
        limit: 10000, // Large limit to get all users
      };

      if (debouncedSearch) {
        exportParams.searchTerm = debouncedSearch;
      }

      if (roleFilter !== "all") {
        exportParams.role = roleFilter as "admin" | "vendor" | "customer";
      }

      const response = await getUsers(exportParams);
      const usersToExport = response.data?.users || [];

      // Convert to CSV
      const headers = [
        "ID",
        "First Name",
        "Last Name",
        "Email",
        "Phone Number",
        "Role",
        "Active Role",
        "Email Verified",
        "Phone Verified",
        "Country",
        "Vendor Onboarding Status",
        "Subscription Type",
        "Subscription Active",
        "Account Source",
        "Invited By",
        "Joined Date",
      ];

      const csvRows = [
        headers.join(","),
        ...usersToExport.map((user) => {
          return [
            user.id,
            user.firstName || "",
            user.lastName || "",
            user.email,
            user.phoneNumber || "",
            user.roles.join("; "),
            user.activeRole,
            user.isEmailVerified ? "Yes" : "No",
            user.isPhoneNumberVerified ? "Yes" : "No",
            user.countryName || "",
            user.vendorOnboardingStatus || "",
            user.subscriptionType || "",
            user.isSubscriptionActive ? "Yes" : "No",
            formatAccountSource(user.accountSource),
            formatInvitedBy(user),
            formatDate(user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt)),
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(",");
        }),
      ];

      const csvContent = csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: `Exported ${usersToExport.length} users to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export users",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Users"
        description="Manage accounts, onboard with invites, or create users directly"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "users" ? (
              <>
                <Button onClick={() => setCreateUserOpen(true)} size="sm">
                  <UserPlus className="h-4 w-4" />
                  Add user
                </Button>
                <Button onClick={exportUsers} variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </>
            ) : (
              <Button onClick={() => setCreateInviteOpen(true)} size="sm">
                <Link2 className="h-4 w-4" />
                New invite
              </Button>
            )}
          </div>
        }
      />

      {pendingInviteUrl && (
        <InviteLinkBanner
          url={pendingInviteUrl}
          onDismiss={() => setPendingInviteUrl(null)}
        />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="h-auto p-1 bg-muted/60">
          <TabsTrigger value="users" className="gap-2 px-4 py-2">
            <UsersIcon className="h-4 w-4" />
            All users
          </TabsTrigger>
          <TabsTrigger value="invites" className="gap-2 px-4 py-2">
            <Mail className="h-4 w-4" />
            Invites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4 mt-0">
          <div className="filter-bar">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search users..."
            />
            <FilterSelect
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Role"
              options={roleOptions}
              allLabel="All Roles"
            />
          </div>

          {isLoading ? (
            <TableSkeleton columns={9} rows={10} />
          ) : users.length === 0 ? (
            <div className="card">
              <EmptyState
                title="No users found"
                description="Try adjusting your search or filter criteria"
                icon={<UsersIcon className="h-6 w-6" />}
              />
            </div>
          ) : (
            <div className="card">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Source</th>
                    <th>Invited by</th>
                    <th>Status</th>
                    <th>Subscription</th>
                    <th>Country</th>
                    <th>Joined</th>
                    <th className="w-[50px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.profileImageUrl && (
                            <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                          )}
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          {user.firstName && user.lastName ?
                          <p className="font-medium text-foreground capitalize">
                            {user.firstName} {user.lastName}
                          </p>
                          :
                          <p className="font-medium text-foreground capitalize">
                            Not Provided
                          </p>}
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="capitalize text-foreground">
                        {user.activeRole}
                      </span>
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {formatAccountSource(user.accountSource)}
                    </td>
                    <td className="text-sm text-muted-foreground">
                      {formatInvitedBy(user)}
                    </td>
                    <td>
                      {user.vendorOnboardingStatus ? (
                        <StatusBadge status={user.vendorOnboardingStatus} />
                      ) : (
                        <StatusBadge status={user.isEmailVerified ? "active" : "pending"} />
                      )}
                    </td>
                    <td>
                      {user.isSubscriptionActive !== undefined ? (
                        <StatusBadge status={user.isSubscriptionActive ? "active" : "inactive"} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="text-muted-foreground">
                      {user.countryName || "—"}
                    </td>
                    <td className="text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="h-4 w-4 mr-2" />
                            Send email
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
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 shrink-0">
                        {user.profileImageUrl && (
                          <AvatarImage src={user.profileImageUrl} alt={`${user.firstName} ${user.lastName}`} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground capitalize truncate">
                          {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "Not Provided"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2" />
                          Send email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="capitalize text-foreground bg-muted px-2 py-1 rounded">{user.activeRole}</span>
                    {user.accountSource && (
                      <span className="text-muted-foreground bg-muted px-2 py-1 rounded">
                        {formatAccountSource(user.accountSource)}
                      </span>
                    )}
                    {user.vendorOnboardingStatus ? (
                      <StatusBadge status={user.vendorOnboardingStatus} />
                    ) : (
                      <StatusBadge status={user.isEmailVerified ? "active" : "pending"} />
                    )}
                    {user.isSubscriptionActive !== undefined && (
                      <StatusBadge status={user.isSubscriptionActive ? "active" : "inactive"} />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {user.countryName && <span>{user.countryName}</span>}
                    {user.invitedBy && <span>Invited by {formatInvitedBy(user)}</span>}
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1}–{Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of {paginationMeta.total} users
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
        </TabsContent>

        <TabsContent value="invites" className="mt-0">
          <InvitesPanel />
        </TabsContent>
      </Tabs>

      <CreateUserSheet open={createUserOpen} onOpenChange={setCreateUserOpen} />
      <CreateInviteSheet
        open={createInviteOpen}
        onOpenChange={setCreateInviteOpen}
        onInviteUrlCreated={(url) => {
          setPendingInviteUrl(url);
          setActiveTab("invites");
        }}
      />
    </div>
  );
}
