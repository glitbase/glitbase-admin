import { Outlet, useLocation, NavLink, Navigate } from "react-router-dom";
import { Store, Sparkles, Crown, HelpCircle, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

const categorySubItems = [
  { title: "Marketplace Categories", url: "/categories/marketplace", icon: Store },
  { title: "Inspiration Categories", url: "/categories/inspiration", icon: Sparkles },
  { title: "Subscription Plans", url: "/categories/subscription-plans", icon: Crown },
  { title: "Policies / FAQs", url: "/categories/faqs", icon: HelpCircle },
  { title: "Glitfinder Discovery", url: "/categories/glitfinder-categories", icon: Compass },
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
    <div className="flex flex-col md:flex-row gap-0 md:gap-6 h-full">
      {/* Mobile sub-nav (horizontal scrollable tabs) */}
      <nav className="md:hidden border-b border-border bg-card overflow-x-auto shrink-0">
        <ul className="flex items-center gap-1 p-2 min-w-max">
          {categorySubItems.map((item) => (
            <li key={item.url}>
              <NavLink
                to={item.url}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap",
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

      {/* Desktop sub-sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-border bg-card">
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
      <div className="flex-1 min-w-0 pt-3 md:pt-0">
        <Outlet />
      </div>
    </div>
  );
}

// Index route redirect component
export function CategoriesIndex() {
  return <Navigate to="/categories/marketplace" replace />;
}
