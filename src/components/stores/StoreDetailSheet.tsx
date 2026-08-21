import { useQuery } from "@tanstack/react-query";
import {
  Store as StoreIcon,
  MapPin,
  Star,
  Eye,
  Calendar,
  Clock,
  Tag,
  Layers,
  HelpCircle,
  Shield,
  CreditCard,
  Truck,
  User,
  AlertTriangle,
  Check,
  X,
  Ban,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/DataTable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getStoreById } from "@/services/storesApi";
import type { Store } from "@/types/api";
import {
  getStoreOwnerName,
  getStoreVisibility,
  normalizeGalleryImages,
  normalizeStoreFromApi,
  type StoreVisibility,
} from "@/lib/storeUtils";

interface StoreDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: Store | null;
  onApprove?: (store: Store) => void;
  onReject?: (store: Store) => void;
  onSuspend?: (store: Store) => void;
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
    <div className={`space-y-1 ${className ?? ""}`}>
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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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

function getInitials(name: string) {
  if (!name || name === "—") return "??";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function renderFooterActions(
  visibility: StoreVisibility,
  store: Store,
  onApprove?: (store: Store) => void,
  onReject?: (store: Store) => void,
  onSuspend?: (store: Store) => void
) {
  const actions: React.ReactNode[] = [];

  if (visibility === "pending") {
    if (onApprove) {
      actions.push(
        <Button key="approve" size="sm" onClick={() => onApprove(store)}>
          <Check className="h-4 w-4 mr-1.5" />
          Approve
        </Button>
      );
    }
    if (onReject) {
      actions.push(
        <Button
          key="reject"
          size="sm"
          variant="outline"
          className="text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => onReject(store)}
        >
          <X className="h-4 w-4 mr-1.5" />
          Reject
        </Button>
      );
    }
  }

  if (visibility === "published" && onSuspend) {
    actions.push(
      <Button
        key="suspend"
        size="sm"
        variant="outline"
        className="text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => onSuspend(store)}
      >
        <Ban className="h-4 w-4 mr-1.5" />
        Suspend
      </Button>
    );
  }

  if (visibility === "rejected" && onApprove) {
    actions.push(
      <Button key="approve" size="sm" onClick={() => onApprove(store)}>
        <Check className="h-4 w-4 mr-1.5" />
        Approve
      </Button>
    );
  }

  if (!actions.length) return null;

  return <div className="flex flex-wrap gap-2 pt-2 border-t border-border">{actions}</div>;
}

export function StoreDetailSheet({
  open,
  onOpenChange,
  store,
  onApprove,
  onReject,
  onSuspend,
}: StoreDetailSheetProps) {
  const storeId = store?.id;

  const { data: detailResponse, isLoading, isError } = useQuery({
    queryKey: ["store-detail", storeId],
    queryFn: () => getStoreById(storeId!),
    enabled: open && Boolean(storeId),
    retry: 1,
  });

  const detailStore = detailResponse?.data?.store
    ? normalizeStoreFromApi(detailResponse.data.store)
    : store;

  if (!detailStore) return null;

  const visibility = getStoreVisibility(detailStore);
  const ownerName = getStoreOwnerName(detailStore.owner);
  const galleryImages = normalizeGalleryImages(detailStore.gallery);
  const openingHours = detailStore.openingHours ?? [];
  const policies = detailStore.policies;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl h-auto overflow-y-auto m-3 rounded-md"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StoreIcon className="h-5 w-5" />
            Store details
          </SheetTitle>
          <SheetDescription>Review full store profile and marketplace visibility</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {detailStore.bannerImageUrl && (
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={detailStore.bannerImageUrl}
                alt={`${detailStore.name} banner`}
                className="w-full h-36 object-cover"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{detailStore.name}</h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{detailStore.id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={visibility} />
                <StatusBadge status={detailStore.status} />
              </div>
            </div>

            {detailStore.rejectionReason && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Rejection reason</p>
                    <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                      {detailStore.rejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <p className="text-xs text-muted-foreground">Loading full store profile…</p>
            )}
            {isError && (
              <p className="text-xs text-muted-foreground">
                Showing summary from list — full profile could not be loaded.
              </p>
            )}
          </div>

          {detailStore.description && (
            <div className="space-y-3">
              <SectionTitle>About</SectionTitle>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {detailStore.description}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <SectionTitle>Overview</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="Store types">
                {detailStore.type?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {detailStore.type.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-primary/10 text-primary"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </DetailField>
              <DetailField label="Onboarding status">
                {detailStore.onboardingStatus ? (
                  <StatusBadge status={detailStore.onboardingStatus} />
                ) : (
                  "—"
                )}
              </DetailField>
              <DetailField label="Views">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  {detailStore.viewCount ?? 0}
                </div>
              </DetailField>
              <DetailField label="Rating">
                {detailStore.rating ? (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    {detailStore.rating.toFixed(1)}
                    <span className="text-muted-foreground">
                      ({detailStore.reviewCount ?? 0} reviews)
                    </span>
                  </div>
                ) : (
                  "No reviews yet"
                )}
              </DetailField>
              {detailStore.maxBookingPerSlot != null && (
                <DetailField label="Max bookings per slot">
                  {detailStore.maxBookingPerSlot}
                </DetailField>
              )}
              {detailStore.infoUpdateCount != null && (
                <DetailField label="Profile updates">{detailStore.infoUpdateCount}</DetailField>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <SectionTitle>Owner</SectionTitle>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(ownerName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{ownerName}</p>
                <p className="text-xs text-muted-foreground truncate">{detailStore.owner.email}</p>
                {detailStore.owner.phoneNumber && (
                  <p className="text-xs text-muted-foreground">{detailStore.owner.phoneNumber}</p>
                )}
                {(detailStore.owner.countryName || detailStore.owner.countryCode) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[detailStore.owner.countryName, detailStore.owner.countryCode]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  ID: {detailStore.owner.id}
                </p>
              </div>
            </div>
          </div>

          {detailStore.location && (
            <div className="space-y-4">
              <SectionTitle>Location</SectionTitle>
              <div className="rounded-md bg-muted/40 p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">{detailStore.location.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {[detailStore.location.city, detailStore.location.state, detailStore.location.zipcode]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {openingHours.length > 0 && (
            <div className="space-y-4">
              <SectionTitle>Opening hours</SectionTitle>
              <div className="rounded-md border border-border divide-y divide-border">
                {openingHours.map((hour) => (
                  <div
                    key={hour.day}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="capitalize font-medium">{hour.day}</span>
                    {hour.isOpen ? (
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {hour.openingTime} – {hour.closingTime}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(detailStore.preferredCategories?.length || detailStore.tags?.length) && (
            <div className="space-y-4">
              <SectionTitle>Categories & tags</SectionTitle>
              <div className="space-y-3">
                {detailStore.preferredCategories?.length ? (
                  <DetailField label="Preferred categories">
                    <div className="flex flex-wrap gap-1.5">
                      {detailStore.preferredCategories.map((category) => (
                        <span
                          key={category}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-foreground"
                        >
                          <Layers className="h-3 w-3" />
                          {category}
                        </span>
                      ))}
                    </div>
                  </DetailField>
                ) : null}
                {detailStore.tags?.length ? (
                  <DetailField label="Tags">
                    <div className="flex flex-wrap gap-1.5">
                      {detailStore.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-foreground"
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </DetailField>
                ) : null}
              </div>
            </div>
          )}

          {galleryImages.length > 0 && (
            <div className="space-y-4">
              <SectionTitle>Gallery</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {galleryImages.map((image) => (
                  <a
                    key={image.id}
                    href={image.imageURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block aspect-square rounded-md overflow-hidden border border-border hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={image.imageURL}
                      alt="Store gallery"
                      className="w-full h-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {detailStore.faqs?.length ? (
            <div className="space-y-4">
              <SectionTitle>FAQs</SectionTitle>
              <div className="space-y-3">
                {detailStore.faqs.map((faq) => (
                  <div key={faq.id} className="rounded-md border border-border p-3 space-y-1">
                    <p className="text-sm font-medium flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      {faq.question}
                    </p>
                    <p className="text-sm text-muted-foreground pl-6 whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {policies && (policies.booking || policies.payment || policies.store) && (
            <div className="space-y-4">
              <SectionTitle>Policies</SectionTitle>
              <div className="space-y-3">
                {policies.booking && (
                  <div className="rounded-md border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Booking
                    </p>
                    {policies.booking.cancellation && (
                      <DetailField label="Cancellation">
                        <span className="whitespace-pre-wrap">{policies.booking.cancellation}</span>
                      </DetailField>
                    )}
                    {policies.booking.rescheduling && (
                      <DetailField label="Rescheduling">
                        <span className="whitespace-pre-wrap">{policies.booking.rescheduling}</span>
                      </DetailField>
                    )}
                    {policies.booking.homeServiceFee != null && (
                      <DetailField label="Home service fee">
                        {policies.booking.homeServiceFee}
                      </DetailField>
                    )}
                  </div>
                )}
                {policies.payment && (
                  <div className="rounded-md border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment
                    </p>
                    <DetailField label="Deposit">
                      {policies.payment.depositType === "percentage"
                        ? `${policies.payment.amount}%`
                        : policies.payment.amount}
                    </DetailField>
                    {policies.payment.lateFee != null && (
                      <DetailField label="Late fee">{policies.payment.lateFee}</DetailField>
                    )}
                  </div>
                )}
                {policies.store && (
                  <div className="rounded-md border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" />
                      Store
                    </p>
                    {policies.store.refund && (
                      <DetailField label="Refund">
                        <span className="whitespace-pre-wrap">{policies.store.refund}</span>
                      </DetailField>
                    )}
                    {policies.store.exchange && (
                      <DetailField label="Exchange">
                        <span className="whitespace-pre-wrap">{policies.store.exchange}</span>
                      </DetailField>
                    )}
                    {policies.store.shipping && (
                      <DetailField label="Shipping">
                        <span className="whitespace-pre-wrap">{policies.store.shipping}</span>
                      </DetailField>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {detailStore.setupProgress && (
            <div className="space-y-4">
              <SectionTitle>Setup progress</SectionTitle>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall completion</span>
                  <span className="font-medium">{detailStore.setupProgress.overallPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${detailStore.setupProgress.overallPercentage}%` }}
                  />
                </div>
                {detailStore.setupProgress.completedSteps?.length ? (
                  <DetailField label="Completed steps">
                    <div className="flex flex-wrap gap-1.5">
                      {detailStore.setupProgress.completedSteps.map((step) => (
                        <span
                          key={step}
                          className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success capitalize"
                        >
                          {step.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </DetailField>
                ) : null}
                {detailStore.setupProgress.pendingSteps?.length ? (
                  <DetailField label="Pending steps">
                    <div className="flex flex-wrap gap-1.5">
                      {detailStore.setupProgress.pendingSteps.map((step) => (
                        <span
                          key={step}
                          className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize"
                        >
                          {step.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </DetailField>
                ) : null}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <SectionTitle>Timestamps</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailField label="Created">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateTime(detailStore.createdAt)}</span>
                </div>
              </DetailField>
              <DetailField label="Last updated">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(detailStore.updatedAt)}</span>
                </div>
              </DetailField>
            </div>
          </div>

          {renderFooterActions(visibility, detailStore, onApprove, onReject, onSuspend)}
        </div>
      </SheetContent>
    </Sheet>
  );
}
