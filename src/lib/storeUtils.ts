import type { Store, StoreGalleryImage } from "@/types/api";

export type StoreVisibility = "pending" | "published" | "rejected";

export function getStoreVisibility(store: Pick<Store, "isPublic" | "rejectionReason">): StoreVisibility {
  if (store.isPublic) return "published";
  if (store.rejectionReason) return "rejected";
  return "pending";
}

export function getStoreOwnerName(owner: Store["owner"]): string {
  if (owner.name?.trim()) return owner.name.trim();
  const full = `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim();
  return full || "—";
}

export function normalizeGalleryImages(
  gallery?: Store["gallery"]
): StoreGalleryImage[] {
  if (!gallery?.length) return [];
  return gallery.map((item, index) => {
    if (typeof item === "string") {
      return { id: `gallery-${index}`, imageURL: item };
    }
    return {
      id: item.id || `gallery-${index}`,
      imageURL: item.imageURL,
    };
  });
}

export function normalizeStoreFromApi(raw: Store & { _id?: string }): Store {
  return {
    ...raw,
    id: raw.id || raw._id || "",
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
    owner: {
      ...raw.owner,
      id: raw.owner?.id || (raw.owner as Store["owner"] & { _id?: string })?._id || "",
    },
  };
}
