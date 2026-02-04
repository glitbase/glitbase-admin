import { User, Package, CreditCard, Store, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "user",
    message: "New vendor registered",
    name: "Amara Okonkwo",
    time: "2 minutes ago",
    icon: User,
  },
  {
    id: 2,
    type: "product",
    message: "Product submitted for approval",
    name: "Vintage Lace Veil",
    time: "15 minutes ago",
    icon: Package,
  },
  {
    id: 3,
    type: "payment",
    message: "Payment received",
    name: "£500.00 from Sarah Johnson",
    time: "1 hour ago",
    icon: CreditCard,
  },
  {
    id: 4,
    type: "store",
    message: "New store created",
    name: "Glamour Bridal",
    time: "2 hours ago",
    icon: Store,
  },
  {
    id: 5,
    type: "booking",
    message: "Booking confirmed",
    name: "BK-2024-001",
    time: "3 hours ago",
    icon: CalendarCheck,
  },
];

export function RecentActivity() {
  return (
    <div className="stat-card">
      <h3 className="font-medium text-foreground mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <div
              className={cn(
                "p-2 rounded-lg bg-muted shrink-0",
                activity.type === "user" && "text-primary",
                activity.type === "product" && "text-info",
                activity.type === "payment" && "text-success",
                activity.type === "store" && "text-warning",
                activity.type === "booking" && "text-chart-5"
              )}
            >
              <activity.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{activity.message}</p>
              <p className="text-xs text-muted-foreground truncate">
                {activity.name}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
