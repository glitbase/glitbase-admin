import { useState, useMemo } from "react";
import { MoreHorizontal, Eye, CreditCard } from "lucide-react";
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
import { mockPayments } from "@/lib/mock-data";
import type { PaymentStatus } from "@/types/api";

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((payment) => {
      const matchesSearch =
        !search ||
        payment.paymentReference.toLowerCase().includes(search.toLowerCase()) ||
        payment.user.name.toLowerCase().includes(search.toLowerCase()) ||
        payment.user.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || payment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "failed", label: "Failed" },
    { value: "refunded", label: "Refunded" },
  ];

  const formatPrice = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      GBP: "£",
      USD: "$",
      NGN: "₦",
    };
    return `${symbols[currency] || currency} ${amount.toFixed(2)}`;
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
        title="Payments"
        description="View and manage all platform payments"
      />

      <div className="filter-bar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search payments..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Status"
          options={statusOptions}
        />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {filteredPayments.length === 0 ? (
          <EmptyState
            title="No payments found"
            description="Try adjusting your search or filter criteria"
            icon={<CreditCard className="h-6 w-6" />}
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>User</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th className="w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <span className="font-mono text-foreground">
                      {payment.paymentReference}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="text-foreground">{payment.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.user.email}
                      </p>
                    </div>
                  </td>
                  <td className="capitalize text-muted-foreground">
                    {payment.paymentType.replace(/_/g, " ")}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="capitalize text-foreground">
                        {payment.paymentMethod.replace(/_/g, " ")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        via {payment.paymentGateway}
                      </span>
                    </div>
                  </td>
                  <td className="font-medium text-foreground">
                    {formatPrice(payment.amount, payment.currency)}
                  </td>
                  <td>
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="text-muted-foreground">
                    {formatDate(payment.createdAt)}
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
