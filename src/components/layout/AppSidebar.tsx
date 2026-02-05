import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  Briefcase,
  Store,
  CalendarCheck,
  CreditCard,
  Wallet,
  Crown,
  FolderTree,
  Flag,
  Star,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Users", url: "/users", icon: Users },
  { title: "Stores", url: "/stores", icon: Store },
  { title: "Services", url: "/services", icon: Briefcase },
  { title: "Products", url: "/products", icon: Package },
];

const managementItems = [
  { title: "Bookings", url: "/bookings", icon: CalendarCheck },
  { title: "Payments", url: "/payments", icon: CreditCard },
  { title: "Payouts", url: "/payouts", icon: Wallet },
  { title: "Subscriptions", url: "/subscriptions", icon: Crown },
];

const contentItems = [
  { title: "Categories", url: "/categories", icon: FolderTree },
  { title: "Reports", url: "/reports", icon: Flag },
  { title: "Reviews", url: "/reviews", icon: Star },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const isInGroup = (items: typeof mainNavItems) =>
    items.some((item) => isActive(item.url));

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderNavItem = (item: typeof mainNavItems[0]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        isActive={isActive(item.url)}
        tooltip={collapsed ? item.title : undefined}
      >
        <NavLink
          to={item.url}
          end
          className="flex items-center gap-3"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground"
          aria-disabled={item.url === "/products"}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-4">
        <div className="flex items-center justify-center h-12">
          <img
            src="https://res.cloudinary.com/giftguy/image/upload/v1765262899/glitbase_jlcbgl.png"
            alt="Glitbase"
            className={cn(
              "shrink-0 object-contain",
              collapsed ? "h-auto w-16" : "w-40 h-auto"
            )}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(collapsed && "sr-only")}>
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{mainNavItems.map(renderNavItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Collapsible defaultOpen={true} className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel
                className={cn(
                  "cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors",
                  collapsed && "sr-only"
                )}
              >
                <span className="flex-1">Management</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>{managementItems.map(renderNavItem)}</SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <Collapsible defaultOpen={true} className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel
                className={cn(
                  "cursor-pointer hover:bg-sidebar-accent/50 rounded-md transition-colors",
                  collapsed && "sr-only"
                )}
              >
                <span className="flex-1">Content</span>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>{contentItems.map(renderNavItem)}</SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu className={cn(collapsed && "items-center")}>
          <SidebarMenuItem className={cn(collapsed && "flex justify-center")}>
            <SidebarMenuButton
              tooltip={collapsed ? "Settings" : undefined}
              className={cn(
                "text-sidebar-foreground",
                collapsed && "mx-auto"
              )}
            >
              <Settings className="h-4 w-4" />
              {!collapsed && <span>Settings</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {collapsed ? (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center justify-center w-full mt-2 p-2 rounded-lg hover:bg-sidebar-accent/50 transition-colors">
                <Avatar className="h-8 w-8 shrink-0 cursor-pointer">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" align="start" className="w-56 p-0">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                      {user?.firstName?.[0]}
                      {user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <div className="flex items-center gap-3 rounded-lg p-2 mt-2 bg-sidebar-accent/50">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-sidebar-muted truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
