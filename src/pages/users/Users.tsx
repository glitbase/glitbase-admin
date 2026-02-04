import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MoreHorizontal, Mail, Eye, Users as UsersIcon, Loader2, Download } from "lucide-react";
import {
  PageHeader,
  SearchInput,
  FilterSelect,
  StatusBadge,
  EmptyState,
} from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getUsers, type GetUsersParams } from "@/services/usersApi";
import type { User, UserRole } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export default function UsersPage() {
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
        description="Manage platform users, vendors, and administrators"
        action={
          <Button onClick={exportUsers} variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

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
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try adjusting your search or filter criteria"
            icon={<UsersIcon className="h-6 w-6" />}
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
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
            
            {/* Pagination */}
            {paginationMeta && paginationMeta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {((paginationMeta.page - 1) * paginationMeta.limit) + 1} to{" "}
                  {Math.min(paginationMeta.page * paginationMeta.limit, paginationMeta.total)} of{" "}
                  {paginationMeta.total} users
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
    </div>
  );
}
