import { Outlet, useLocation, NavLink, Navigate } from "react-router-dom";
import { Store, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const categorySubItems = [
  { title: "Marketplace Categories", url: "/categories/marketplace", icon: Store },
  { title: "Inspiration Categories", url: "/categories/inspiration", icon: Sparkles },
  { title: "Subscription Plans", url: "/categories/subscription-plans", icon: Crown },
];

export function CategoriesLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/categories/marketplace") {
      return location.pathname === "/categories" || location.pathname === path;
    }
    return location.pathname === path;
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Sub-sidebar */}
      <aside className="w-64 shrink-0 border-r border-border bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground opacity-0">Categories</h2>
          <p className="text-xs text-muted-foreground mt-1 opacity-0">Manage different category types</p>
        </div>
        <nav className="p-2">
          <ul className="space-y-1">
            {categorySubItems.map((item) => (
              <li key={item.url}>
                <NavLink
                  to={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive(item.url)
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

// Index route redirect component
export function CategoriesIndex() {
  return <Navigate to="/categories/marketplace" replace />;
}

