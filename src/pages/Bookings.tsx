import { useState, useMemo } from "react";
import { MoreHorizontal, Eye, CalendarCheck } from "lucide-react";
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
import { mockBookings } from "@/lib/mock-data";
import type { BookingStatus } from "@/types/api";

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = useMemo(() => {
    return mockBookings.filter((booking) => {
      const matchesSearch =
        !search ||
        booking.bookingReference.toLowerCase().includes(search.toLowerCase()) ||
        booking.user.name.toLowerCase().includes(search.toLowerCase()) ||
        booking.store.name.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const formatPrice = (price: number, currency: string) => {
    const symbols: Record<string, string> = {
      GBP: "£",
      USD: "$",
      NGN: "₦",
    };
    return `${symbols[currency] || currency} ${price.toFixed(2)}`;
  };

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
        title="Bookings"
        description="View and manage all platform bookings"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search bookings..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
          allLabel="All Statuses"
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filteredBookings.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description="Try adjusting your search or filter criteria"
            icon={<CalendarCheck className="h-6 w-6" />}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Store</th>
                <th>Service Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    <span className="font-mono text-foreground">
                      {booking.bookingReference}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="text-foreground">{booking.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.user.email}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="text-foreground">{booking.store.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.serviceType}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="text-foreground">
                        {formatDate(booking.serviceDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.serviceTime}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium text-foreground">
                        {formatPrice(
                          booking.pricing.subtotal,
                          booking.pricing.currency
                        )}
                      </p>
                      {booking.pricing.remainingBalance > 0 && (
                        <p className="text-xs text-warning">
                          {formatPrice(
                            booking.pricing.remainingBalance,
                            booking.pricing.currency
                          )}{" "}
                          due
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={booking.status} />
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
