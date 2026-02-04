import {
  Users,
  Store,
  Package,
  Briefcase,
  CalendarCheck,
  DollarSign,
  Clock,
  Flag,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { UserGrowthChart } from "@/components/dashboard/UserGrowthChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PendingApprovals } from "@/components/dashboard/PendingApprovals";
import { mockDashboardStats } from "@/lib/mock-data";

export default function Dashboard() {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Overview of your platform metrics
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="+12.5% from last month"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Active Vendors"
          value={stats.totalVendors.toLocaleString()}
          change="+8.2% from last month"
          changeType="positive"
          icon={Store}
        />
        <StatCard
          title="Total Revenue"
          value={`£${stats.totalRevenue.toLocaleString()}`}
          change="+18.3% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings.toLocaleString()}
          change="+5.1% from last month"
          changeType="positive"
          icon={CalendarCheck}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          iconColor="text-info"
        />
        <StatCard
          title="Services"
          value={stats.totalServices.toLocaleString()}
          icon={Briefcase}
          iconColor="text-chart-3"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          icon={Clock}
          iconColor="text-warning"
        />
        <StatCard
          title="Active Reports"
          value={stats.activeReports}
          icon={Flag}
          iconColor="text-destructive"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <UserGrowthChart />
      </div>

      {/* Activity & Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <PendingApprovals />
      </div>
    </div>
  );
}
