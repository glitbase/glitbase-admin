import type { Booking, StoreOwner } from "@/types/api";

export function getBookingDisplayId(booking: Pick<Booking, "gId" | "bookingReference">): string {
  return booking.gId ?? booking.bookingReference;
}
import { getStoreOwnerName } from "@/lib/storeUtils";

export function getBookingProvider(
  booking: Pick<Booking, "vendor" | "store">,
  storeOwners?: Map<string, StoreOwner>
): Pick<StoreOwner, "id" | "email" | "firstName" | "lastName" | "name"> | null {
  const embedded = booking.vendor ?? booking.store.owner;
  if (embedded?.email) return embedded;

  const owner = storeOwners?.get(booking.store.id);
  if (owner?.email) return owner;

  return null;
}

export function getBookingProviderName(
  booking: Pick<Booking, "vendor" | "store">,
  storeOwners?: Map<string, StoreOwner>
): string {
  const provider = getBookingProvider(booking, storeOwners);
  if (!provider) return "—";
  return getStoreOwnerName(provider);
}

export function getBookingProviderEmail(
  booking: Pick<Booking, "vendor" | "store">,
  storeOwners?: Map<string, StoreOwner>
): string {
  return getBookingProvider(booking, storeOwners)?.email ?? "—";
}
