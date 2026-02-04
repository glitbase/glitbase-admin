import { Construction } from "lucide-react";
import { PageHeader } from "@/components/shared/DataTable";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={title} description={description} />

      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Construction className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-foreground mb-2">Coming Soon</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This section is currently under development. Check back soon for
          updates.
        </p>
      </div>
    </div>
  );
}

export function SubscriptionsPage() {
  return (
    <PlaceholderPage
      title="Subscriptions"
      description="Manage subscription plans and vendor subscriptions"
    />
  );
}

export function CategoriesPage() {
  return (
    <PlaceholderPage
      title="Categories"
      description="Manage marketplace and inspiration categories"
    />
  );
}

export function ReportsPage() {
  return (
    <PlaceholderPage
      title="Reports"
      description="View and resolve user reports"
    />
  );
}

export function ReviewsPage() {
  return (
    <PlaceholderPage
      title="Reviews"
      description="View and moderate user reviews"
    />
  );
}
