import { Package, Briefcase, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mockProducts, mockServices } from "@/lib/mock-data";

export function PendingApprovals() {
  const pendingProducts = mockProducts.filter((p) => p.status === "pending");
  const pendingServices = mockServices.filter((s) => s.status === "pending");

  const pendingItems = [
    ...pendingProducts.map((p) => ({
      id: p.id,
      type: "product" as const,
      name: p.name,
      vendor: p.vendor.name,
      price: `${p.currency} ${p.price.toFixed(2)}`,
      icon: Package,
    })),
    ...pendingServices.map((s) => ({
      id: s.id,
      type: "service" as const,
      name: s.name,
      vendor: s.vendor.name,
      price: `${s.currency} ${s.price.toFixed(2)}`,
      icon: Briefcase,
    })),
  ];

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">Pending Approvals</h3>
        <span className="text-xs text-muted-foreground">
          {pendingItems.length} items
        </span>
      </div>

      {pendingItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No pending approvals
        </div>
      ) : (
        <div className="space-y-3">
          {pendingItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="p-2 rounded-lg bg-background">
                <item.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.vendor} • {item.price}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-success hover:bg-success/10 hover:text-success"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
