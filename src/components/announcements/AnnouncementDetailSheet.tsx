import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Megaphone,
  Mail,
  Bell,
  Smartphone,
  Calendar,
  Users,
  AlertTriangle,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/DataTable";
import { getAnnouncementById } from "@/services/announcementsApi";
import type { Announcement, AnnouncementChannel, AnnouncementSender } from "@/types/api";

interface AnnouncementDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcementId: string | null;
  preview?: Announcement | null;
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

function getSenderName(sentBy: AnnouncementSender | string) {
  if (typeof sentBy === "string") return sentBy;
  const full = `${sentBy.firstName ?? ""} ${sentBy.lastName ?? ""}`.trim();
  return full || sentBy.email;
}

function formatAudience(audience: Announcement["audience"]) {
  return audience
    .map((item) => (item === "customers" ? "Customers" : "Providers"))
    .join(", ");
}

function formatChannel(channel: AnnouncementChannel) {
  switch (channel) {
    case "email":
      return "Email";
    case "in_app":
      return "In-app";
    case "push":
      return "Push";
  }
}

function StatRow({
  label,
  stats,
}: {
  label: string;
  stats: { attempted: number; succeeded: number; failed: number };
}) {
  if (!stats.attempted) return null;

  return (
    <div className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-border last:border-0">
      <span className="font-medium capitalize">{label}</span>
      <span className="text-muted-foreground">{stats.attempted} attempted</span>
      <span className="text-success">{stats.succeeded} sent</span>
      <span className="text-destructive">{stats.failed} failed</span>
    </div>
  );
}

export function AnnouncementDetailSheet({
  open,
  onOpenChange,
  announcementId,
  preview,
}: AnnouncementDetailSheetProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["announcement", announcementId],
    queryFn: () => getAnnouncementById(announcementId!),
    enabled: open && Boolean(announcementId),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.announcement?.status;
      return status === "sending" ? 3000 : false;
    },
  });

  const announcement = useMemo(() => {
    const row = data?.data?.announcement ?? preview;
    if (!row) return null;
    return {
      ...row,
      id: row.id || (row as Announcement & { _id?: string })._id || "",
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    };
  }, [data?.data?.announcement, preview]);

  if (!announcement) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 pr-6">
            <Megaphone className="h-5 w-5 shrink-0" />
            <span className="truncate">{announcement.title}</span>
          </SheetTitle>
          <SheetDescription>Broadcast details and delivery statistics</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {isLoading && announcement.status === "sending" && (
            <p className="text-xs text-muted-foreground">Refreshing delivery stats…</p>
          )}

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={announcement.status} />
            <StatusBadge status={announcement.type} />
          </div>

          {announcement.failureReason && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive whitespace-pre-wrap">
                {announcement.failureReason}
              </p>
            </div>
          )}

          {announcement.imageUrl && (
            <img
              src={announcement.imageUrl}
              alt=""
              className="w-full max-h-48 object-cover rounded-lg border border-border"
            />
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold border-b border-border pb-2">Message</h3>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{announcement.body}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Audience</p>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                {formatAudience(announcement.audience)}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Channels</p>
              <div className="flex flex-wrap gap-1.5">
                {announcement.channels.map((channel) => (
                  <span
                    key={channel}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs"
                  >
                    {channel === "email" && <Mail className="h-3 w-3" />}
                    {channel === "in_app" && <Bell className="h-3 w-3" />}
                    {channel === "push" && <Smartphone className="h-3 w-3" />}
                    {formatChannel(channel)}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recipients</p>
              <p className="font-medium">{announcement.recipientCount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sent by</p>
              <p>{getSenderName(announcement.sentBy)}</p>
            </div>
            {announcement.actionUrl && (
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Action URL</p>
                <p className="font-mono text-xs break-all">{announcement.actionUrl}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold border-b border-border pb-2">Delivery stats</h3>
            <div className="rounded-md border border-border p-3">
              <StatRow label="Email" stats={announcement.deliveryStats.email} />
              <StatRow label="In-app" stats={announcement.deliveryStats.inApp} />
              <StatRow label="Push" stats={announcement.deliveryStats.push} />
              {!announcement.channels.some((channel) => {
                const key = channel === "in_app" ? "inApp" : channel;
                return announcement.deliveryStats[key as keyof typeof announcement.deliveryStats]
                  ?.attempted;
              }) && (
                <p className="text-sm text-muted-foreground py-2">
                  {announcement.status === "sending"
                    ? "Delivery in progress…"
                    : "No delivery stats recorded yet."}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <div>
                <p className="text-xs">Created</p>
                <p className="text-foreground">{formatDateTime(announcement.createdAt)}</p>
              </div>
            </div>
            {announcement.sentAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-xs">Sent</p>
                  <p className="text-foreground">{formatDateTime(announcement.sentAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
