import { Skeleton } from "@/components/ui/skeleton";

export function GlitCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        <Skeleton className="w-full h-full" />
        {/* Stats overlay skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3 rounded-full bg-white/20" />
                  <Skeleton className="h-3 w-4 bg-white/20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 space-y-2">
        {/* User Info */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full shrink-0" />
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Title */}
        <Skeleton className="h-3 w-full" />

        {/* Description */}
        <div className="space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>

        {/* Category & Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

interface GlitSkeletonGridProps {
  count?: number;
}

export function GlitSkeletonGrid({ count = 10 }: GlitSkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <GlitCardSkeleton key={i} />
      ))}
    </div>
  );
}

