import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Mail,
  Phone,
  MapPin,
  Shield,
  Crown,
  Bell,
  CreditCard,
  Store,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Globe,
  KeyRound,
  UserCheck,
  ExternalLink,
  Hash,
  BadgeCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/DataTable";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getUserById } from "@/services/usersApi";
import type { User, UserNotificationPreferences } from "@/types/api";
import { cn } from "@/lib/utils";

interface UserDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  preview?: User | null;
  onSendEmail?: (user: User) => void;
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatText(value?: string | null) {
  if (value == null || value === "") return "—";
  return value;
}

function formatAccountSource(source?: string) {
  switch (source) {
    case "admin_created":
      return "Admin created";
    case "invite":
      return "Invite";
    case "self_registration":
    case "self_signup":
      return "Self signup";
    default:
      return source ? source.replace(/_/g, " ") : "—";
  }
}

function getDisplayName(user: User) {
  const fromParts = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (user.displayName?.trim()) return user.displayName.trim();
  if (fromParts) return fromParts;
  return user.email;
}

function getInitials(user: User) {
  const name = getDisplayName(user);
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatInvitedBy(invitedBy: User["invitedBy"]) {
  if (!invitedBy) return "—";
  if (typeof invitedBy === "string") return invitedBy;
  const full = `${invitedBy.firstName ?? ""} ${invitedBy.lastName ?? ""}`.trim();
  return full || invitedBy.email || "—";
}

function normalizeUser(raw: User & { _id?: string }): User {
  const subscription = raw.userSubscription;
  return {
    ...raw,
    id: raw.id || raw._id || "",
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    passwordChangedAt: raw.passwordChangedAt ? new Date(raw.passwordChangedAt) : undefined,
    deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : raw.deletedAt ?? undefined,
    subscriptionStartDate: raw.subscriptionStartDate
      ? new Date(raw.subscriptionStartDate)
      : undefined,
    subscriptionEndDate: raw.subscriptionEndDate ? new Date(raw.subscriptionEndDate) : undefined,
    userSubscription: subscription
      ? {
          ...subscription,
          subscriptionStartDate: subscription.subscriptionStartDate
            ? new Date(subscription.subscriptionStartDate)
            : undefined,
          subscriptionEndDate: subscription.subscriptionEndDate
            ? new Date(subscription.subscriptionEndDate)
            : undefined,
          createdAt: subscription.createdAt ? new Date(subscription.createdAt) : undefined,
          updatedAt: subscription.updatedAt ? new Date(subscription.updatedAt) : undefined,
        }
      : undefined,
  };
}

function SectionCard({
  icon: Icon,
  title,
  description,
  accent = "primary",
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  accent?: "primary" | "warning" | "info" | "success";
  children: React.ReactNode;
}) {
  const accentStyles = {
    primary: "bg-primary/10 text-primary ring-primary/20",
    warning: "bg-warning/10 text-warning ring-warning/20",
    info: "bg-info/10 text-info ring-info/20",
    success: "bg-success/10 text-success ring-success/20",
  };

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3.5 border-b border-border bg-muted/30">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
            accentStyles[accent]
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-sm font-semibold text-foreground leading-tight">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "success" | "muted" | "warning";
}) {
  const toneClass = {
    default: "text-foreground",
    success: "text-success",
    muted: "text-muted-foreground",
    warning: "text-warning",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-background/80 px-3 py-2.5 min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">
        {label}
      </p>
      <p className={cn("text-sm font-semibold mt-0.5 truncate capitalize", toneClass)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function InfoRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 py-2.5 border-b border-border/80 last:border-0 last:pb-0 first:pt-0">
      <span className="text-xs font-medium text-muted-foreground shrink-0 sm:w-[42%]">{label}</span>
      <span
        className={cn(
          "text-sm text-foreground sm:text-right sm:max-w-[58%] break-words",
          mono && "font-mono text-xs"
        )}
      >
        {children}
      </span>
    </div>
  );
}

function VerifyItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
      <span className="text-sm text-foreground">{label}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium",
          ok ? "text-success" : "text-muted-foreground"
        )}
      >
        {ok ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verified
          </>
        ) : (
          <>
            <XCircle className="h-3.5 w-3.5" />
            Pending
          </>
        )}
      </span>
    </div>
  );
}

function FlagItem({ label, value }: { label: string; value?: boolean }) {
  if (value === undefined) return null;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        value
          ? "border-primary/25 bg-primary/5 text-foreground"
          : "border-border bg-muted/30 text-muted-foreground"
      )}
    >
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 opacity-50" />
      )}
      <span>{label}</span>
    </div>
  );
}

function NotificationSection({ prefs }: { prefs: UserNotificationPreferences }) {
  const rows: { label: string; value?: boolean }[] = [
    { label: "Booking confirmations", value: prefs.bookingConfirmations },
    { label: "Provider updates", value: prefs.providerUpdates },
    { label: "New messages", value: prefs.newMessages },
    { label: "New orders", value: prefs.newOrderNotifications },
    { label: "Order updates", value: prefs.orderUpdates },
    { label: "Payment confirmations", value: prefs.paymentConfirmations },
  ].filter((r) => r.value !== undefined);

  const gf = prefs.glitfinder;
  const gfRows = gf
    ? [
        { label: "Post likes", value: gf.postLikes },
        { label: "New followers", value: gf.newFollowers },
        { label: "Trending content", value: gf.trendingContent },
        { label: "Recommendations", value: gf.personalisedRecommendations },
      ].filter((r) => r.value !== undefined)
    : [];

  if (!rows.length && !gfRows.length) return null;

  return (
    <SectionCard icon={Bell} title="Notifications" description="Email and in-app preferences">
      <div className="space-y-2">
        {rows.map((row) => (
          <VerifyItem key={row.label} label={row.label} ok={Boolean(row.value)} />
        ))}
      </div>
      {gfRows.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            GlitFinder
          </p>
          <div className="space-y-2">
            {gfRows.map((row) => (
              <VerifyItem key={row.label} label={row.label} ok={Boolean(row.value)} />
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export function UserDetailSheet({
  open,
  onOpenChange,
  userId,
  preview,
  onSendEmail,
}: UserDetailSheetProps) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["user-detail", userId],
    queryFn: () => getUserById(userId!),
    enabled: open && Boolean(userId),
    retry: 1,
  });

  const user = useMemo(() => {
    const row = data?.data?.user ?? preview;
    if (!row) return null;
    return normalizeUser(row);
  }, [data?.data?.user, preview]);

  const displayName = user ? getDisplayName(user) : "User";
  const isDeleted = Boolean(user?.deletedAt || user?.accountStatus === "deleted");
  const subscriptionActive = user?.userSubscription?.isActive ?? user?.isSubscriptionActive;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl flex flex-col gap-0 p-0 h-[calc(100dvh-1.5rem)] m-3 rounded-xl overflow-hidden border-border shadow-xl"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>User details</SheetTitle>
          <SheetDescription>Profile and account</SheetDescription>
        </SheetHeader>

        {isLoading && !user ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-pulse">
            <div className="h-32 rounded-xl bg-muted" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted" />
              ))}
            </div>
            <div className="h-48 rounded-xl bg-muted" />
          </div>
        ) : isError && !user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <p className="text-base font-semibold text-foreground">Could not load user</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          </div>
        ) : user ? (
          <>
            <div className="shrink-0 relative overflow-hidden border-b border-border">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/10 to-accent/40 dark:from-primary/20 dark:via-background dark:to-primary/5" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent dark:from-white/5" />
              <div className="relative px-5 pt-5 pb-4">
                {isDeleted && (
                  <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 backdrop-blur-sm px-3 py-2 flex gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-semibold text-destructive">Deleted account</p>
                      {user.deletionReason && (
                        <p className="text-sm text-foreground mt-0.5">{user.deletionReason}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                  <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background shadow-lg ring-2 ring-primary/20 shrink-0">
                    {user.profileImageUrl ? (
                      <AvatarImage src={user.profileImageUrl} alt={displayName} className="object-cover" />
                    ) : null}
                    <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary/80 dark:text-primary">
                      {user.activeRole} account
                    </p>
                    <h2 className="text-2xl font-bold text-foreground capitalize truncate leading-tight mt-0.5">
                      {displayName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <a
                        href={`mailto:${user.email}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors truncate max-w-full"
                      >
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {user.email}
                      </a>
                      {user.phoneNumber && (
                        <span className="text-muted-foreground/50 hidden sm:inline">·</span>
                      )}
                      {user.phoneNumber && (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {user.phoneNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {user.roles?.map((role) => (
                        <StatusBadge key={role} status={role} />
                      ))}
                      {user.accountStatus && <StatusBadge status={user.accountStatus} />}
                      {user.vendorOnboardingStatus && (
                        <StatusBadge status={user.vendorOnboardingStatus} />
                      )}
                      {user.isSuperAdmin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning border border-warning/30 px-2 py-0.5 text-xs font-medium">
                          <Shield className="h-3 w-3" />
                          Super admin
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 sm:pb-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="shadow-sm"
                      disabled={isDeleted}
                      onClick={() => onSendEmail?.(user)}
                    >
                      <Mail className="h-4 w-4 mr-1.5" />
                      Send email
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-4 py-3 border-b border-border bg-muted/20">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatTile
                  label="Member since"
                  value={formatDate(user.createdAt)}
                  sub={user.countryName ?? undefined}
                />
                <StatTile
                  label="Subscription"
                  value={
                    subscriptionActive === undefined
                      ? "—"
                      : subscriptionActive
                        ? "Active"
                        : "Inactive"
                  }
                  tone={subscriptionActive ? "success" : "muted"}
                  sub={formatText(
                    String(user.userSubscription?.subscriptionType ?? user.subscriptionType ?? "")
                  )}
                />
                <StatTile
                  label="Vendor"
                  value={
                    user.hasStore === undefined
                      ? "—"
                      : user.hasStore
                        ? "Has store"
                        : "No store"
                  }
                  tone={user.hasStore ? "success" : "default"}
                  sub={
                    user.vendorOnboardingStatus
                      ? user.vendorOnboardingStatus.replace(/_/g, " ")
                      : undefined
                  }
                />
                <StatTile
                  label="Profile"
                  value={user.isProfileComplete ? "Complete" : "Incomplete"}
                  tone={user.isProfileComplete ? "success" : "warning"}
                  sub={formatAccountSource(user.accountSource)}
                />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 bg-muted/10">
              {isLoading && (
                <p className="text-xs text-center text-muted-foreground animate-pulse">
                  Refreshing profile…
                </p>
              )}

              <SectionCard
                icon={BadgeCheck}
                title="Trust & verification"
                description="Identity and security signals"
                accent="success"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <VerifyItem label="Email address" ok={user.isEmailVerified} />
                  <VerifyItem label="Phone number" ok={user.isPhoneNumberVerified} />
                  <VerifyItem label="Password configured" ok={Boolean(user.isPasswordSet ?? true)} />
                  <VerifyItem label="Profile complete" ok={Boolean(user.isProfileComplete)} />
                </div>
                {user.passwordChangedAt && (
                  <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    Password last changed {formatDateTime(user.passwordChangedAt)}
                  </p>
                )}
              </SectionCard>

              <SectionCard icon={UserCheck} title="Account" accent="info">
                <InfoRow label="Registration">{formatAccountSource(user.accountSource)}</InfoRow>
                <InfoRow label="Registration status">
                  <span className="capitalize">
                    {formatText(user.registrationStatus?.replace(/_/g, " "))}
                  </span>
                </InfoRow>
                <InfoRow label="Active role">
                  <span className="capitalize font-medium">{user.activeRole}</span>
                </InfoRow>
                <InfoRow label="Invited by">{formatInvitedBy(user.invitedBy)}</InfoRow>
                <InfoRow label="Location">
                  {user.countryName ? (
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {user.countryName}
                      {user.countryCode && (
                        <span className="text-muted-foreground">({user.countryCode})</span>
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </InfoRow>
                {user.mustChangePassword !== undefined && (
                  <InfoRow label="Must change password">
                    {user.mustChangePassword ? (
                      <span className="text-warning font-medium">Required</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </InfoRow>
                )}
                {(user.isDefaultAdmin !== undefined || user.isSuperAdmin !== undefined) && (
                  <InfoRow label="Admin flags">
                    <span className="text-xs">
                      {[
                        user.isSuperAdmin && "Super admin",
                        user.isDefaultAdmin && "Default admin",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </span>
                  </InfoRow>
                )}
              </SectionCard>

              {(user.hasStore !== undefined ||
                user.hasPayoutInfo !== undefined ||
                user.vendorOnboardingStatus ||
                user.hasUsedFreeTrial !== undefined) && (
                <SectionCard icon={Store} title="Provider profile" accent="primary">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    <FlagItem label="Store published" value={user.hasStore} />
                    <FlagItem label="Payout details on file" value={user.hasPayoutInfo} />
                    <FlagItem label="Used free trial" value={user.hasUsedFreeTrial} />
                    <FlagItem label="Subscription info" value={user.hasSubInfo} />
                  </div>
                  {user.vendorOnboardingStatus && (
                    <InfoRow label="Onboarding">
                      <StatusBadge status={user.vendorOnboardingStatus} />
                    </InfoRow>
                  )}
                </SectionCard>
              )}

              {(user.subscriptionType ||
                user.isSubscriptionActive !== undefined ||
                user.userSubscription ||
                user.stripeCustomerId) && (
                <SectionCard
                  icon={Crown}
                  title="Subscription & billing"
                  description="Plan and payment identifiers"
                  accent="warning"
                >
                  <div
                    className={cn(
                      "rounded-lg border px-4 py-3 mb-4",
                      subscriptionActive
                        ? "border-success/30 bg-success/5"
                        : "border-border bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Plan</p>
                        <p className="text-lg font-semibold capitalize text-foreground mt-0.5">
                          {formatText(
                            String(
                              user.userSubscription?.subscriptionType ?? user.subscriptionType ?? "None"
                            )
                          )}
                        </p>
                      </div>
                      {subscriptionActive !== undefined && (
                        <StatusBadge status={subscriptionActive ? "active" : "inactive"} />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/60 text-sm">
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Starts</p>
                        <p className="font-medium mt-0.5">
                          {formatDate(
                            user.userSubscription?.subscriptionStartDate ??
                              user.subscriptionStartDate
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-muted-foreground">Ends</p>
                        <p className="font-medium mt-0.5">
                          {formatDate(
                            user.userSubscription?.subscriptionEndDate ?? user.subscriptionEndDate
                          )}
                        </p>
                      </div>
                    </div>
                    {user.userSubscription?.isCancelled && (
                      <p className="text-xs text-destructive mt-2 font-medium">Subscription cancelled</p>
                    )}
                  </div>
                  {user.userSubscription?.planId && (
                    <InfoRow label="Plan ID" mono>
                      {user.userSubscription.planId}
                    </InfoRow>
                  )}
                  {user.stripeCustomerId && (
                    <InfoRow label="Stripe customer" mono>
                      <span className="inline-flex items-center gap-1 justify-end">
                        <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {user.stripeCustomerId}
                      </span>
                    </InfoRow>
                  )}
                </SectionCard>
              )}

              {user.preferredLocation && (
                <SectionCard icon={MapPin} title="Preferred location">
                  <div className="rounded-lg bg-muted/40 border border-border/80 p-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 text-sm space-y-1">
                        {user.preferredLocation.name && (
                          <p className="font-semibold text-foreground">{user.preferredLocation.name}</p>
                        )}
                        <p className="text-foreground">{formatText(user.preferredLocation.address)}</p>
                        <p className="text-muted-foreground">
                          {[user.preferredLocation.city, user.preferredLocation.state, user.preferredLocation.zipcode]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              )}

              {user.notificationPreferences && (
                <NotificationSection prefs={user.notificationPreferences} />
              )}

              {user.interests && user.interests.length > 0 && (
                <SectionCard icon={Sparkles} title="Interests">
                  <p className="text-xs text-muted-foreground mb-3">
                    {user.interests.length} selected categor{user.interests.length === 1 ? "y" : "ies"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.interests.map((id) => (
                      <code
                        key={id}
                        className="text-[11px] px-2 py-1 rounded-md bg-muted border border-border font-mono text-muted-foreground"
                      >
                        {id}
                      </code>
                    ))}
                  </div>
                </SectionCard>
              )}

              {(user.googleId || user.appleId) && (
                <SectionCard icon={ExternalLink} title="Social sign-in">
                  {user.googleId != null && user.googleId !== "" && (
                    <InfoRow label="Google" mono>
                      {user.googleId}
                    </InfoRow>
                  )}
                  {user.appleId != null && user.appleId !== "" && (
                    <InfoRow label="Apple" mono>
                      {user.appleId}
                    </InfoRow>
                  )}
                </SectionCard>
              )}

              <SectionCard icon={Calendar} title="Activity">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Joined
                    </p>
                    <p className="text-sm font-semibold mt-1">{formatDateTime(user.createdAt)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Last updated
                    </p>
                    <p className="text-sm font-semibold mt-1">{formatDateTime(user.updatedAt)}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-muted/50 border border-dashed border-border px-3 py-2.5 flex items-start gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs text-foreground break-all mt-0.5">{user.id}</p>
                  </div>
                </div>
              </SectionCard>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
