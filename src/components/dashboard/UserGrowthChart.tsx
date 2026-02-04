import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mockUserGrowthData } from "@/lib/mock-data";

export function UserGrowthChart() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-foreground">User Growth</h3>
          <p className="text-sm text-muted-foreground">Users vs Vendors</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-primary" />
            <span className="text-muted-foreground">Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-info" />
            <span className="text-muted-foreground">Vendors</span>
          </div>
        </div>
      </div>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockUserGrowthData} barGap={4}>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [value.toLocaleString()]}
            />
            <Bar
              dataKey="users"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              name="Users"
            />
            <Bar
              dataKey="vendors"
              fill="hsl(var(--info))"
              radius={[4, 4, 0, 0]}
              name="Vendors"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
