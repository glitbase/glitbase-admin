import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ClipboardList,
  Mail,
  Building2,
  Share2,
  Calendar,
  Clock,
  User,
  Store,
  ExternalLink,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/DataTable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getWaitlistEntryById } from "@/services/waitlistApi";
import type { WaitlistEntry } from "@/types/api";
import { cn } from "@/lib/utils";

interface WaitlistDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string | null;
  preview?: WaitlistEntry | null;
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
      {children}
    </h3>
  );
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUserTypeLabel(userType: WaitlistEntry["userType"]) {
  return userType === "vendor" ? "Provider" : "Customer";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function normalizeEntry(row: WaitlistEntry & { _id?: string }) {
  return {
    ...row,
    id: row.id || row._id || "",
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    socialMedia: row.socialMedia ?? [],
  };
}

function SocialHandleRow({
  platform,
  handle,
}: {
  platform: string;
  handle: string;
}) {
  const normalizedHandle = handle.startsWith("@") ? handle : `@${handle}`;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Share2 className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground capitalize">{platform}</p>
        <p className="text-sm font-medium text-foreground truncate">{normalizedHandle}</p>
      </div>
    </div>
  );
}

export function WaitlistDetailSheet({
  open,
  onOpenChange,
  entryId,
  preview,
}: WaitlistDetailSheetProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["waitlist-entry", entryId],
    queryFn: () => getWaitlistEntryById(entryId!),
    enabled: open && Boolean(entryId),
  });

  const entry = useMemo(() => {
    const row = data?.data ?? preview;
    if (!row) return null;
    return normalizeEntry(row);
  }, [data?.data, preview]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl h-auto overflow-y-auto m-3 rounded-md"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 shrink-0" />
            Waitlist entry
          </SheetTitle>
          <SheetDescription>Early-access signup details</SheetDescription>
        </SheetHeader>

        {isLoading && !entry ? (
          <div className="space-y-4 py-6 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-56 rounded bg-muted" />
              </div>
            </div>
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-32 rounded-lg bg-muted" />
          </div>
        ) : entry ? (
          <div className="space-y-6 py-4">
            {/* Profile hero */}
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 shrink-0 border-2 border-background shadow-sm">
                  <AvatarFallback
                    className={cn(
                      "text-base font-semibold",
                      entry.userType === "vendor"
                        ? "bg-primary/15 text-primary"
                        : "bg-secondary text-secondary-foreground"
                    )}
                  >
                    {getInitials(entry.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-foreground capitalize truncate">
                        {entry.name}
                      </h2>
                      <a
                        href={`mailto:${entry.email}`}
                        className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors truncate max-w-full"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{entry.email}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                      </a>
                    </div>
                    <StatusBadge status={entry.userType} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {entry.userType === "vendor" ? (
                        <Store className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {formatUserTypeLabel(entry.userType)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isLoading && (
              <p className="text-xs text-muted-foreground">Refreshing entry details…</p>
            )}

            {/* Contact */}
            <div className="space-y-3">
              <SectionTitle>Contact</SectionTitle>
              <div className="rounded-md border border-border p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailField label="Full name">
                    <span className="font-medium capitalize">{entry.name}</span>
                  </DetailField>
                  <DetailField label="Email">
                    <a
                      href={`mailto:${entry.email}`}
                      className="text-primary hover:underline break-all"
                    >
                      {entry.email}
                    </a>
                  </DetailField>
                  <DetailField label="User type">
                    <StatusBadge status={entry.userType} />
                  </DetailField>
                  <DetailField label="Signup role">
                    {formatUserTypeLabel(entry.userType)}
                  </DetailField>
                </div>
              </div>
            </div>

            {/* Business (providers only) */}
            {entry.userType === "vendor" && (
              <div className="space-y-3">
                <SectionTitle>Business</SectionTitle>
                <div className="rounded-md border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <DetailField label="Business name" className="flex-1">
                      {entry.businessName ? (
                        <span className="font-medium">{entry.businessName}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Not provided</span>
                      )}
                    </DetailField>
                  </div>
                </div>
              </div>
            )}

            {/* Social media */}
            <div className="space-y-3">
              <SectionTitle>Social media</SectionTitle>
              {entry.socialMedia.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                  <Share2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">No social handles provided</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {entry.socialMedia.map((item, index) => (
                    <SocialHandleRow
                      key={`${item.platform}-${item.handle}-${index}`}
                      platform={item.platform}
                      handle={item.handle}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Timeline & metadata */}
            <div className="space-y-3">
              <SectionTitle>Timeline</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 rounded-md border border-border p-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Joined waitlist</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border border-border p-3">
                  <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last updated</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(entry.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-md border border-border bg-muted/20 px-3 py-2.5">
                <p className="text-xs text-muted-foreground mb-1">Entry ID</p>
                <p className="text-xs font-mono text-foreground break-all">{entry.id}</p>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
