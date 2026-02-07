import { Skeleton } from "@/components/ui/skeleton";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  showHeader?: boolean;
  columnWidths?: string[];
}

export function TableSkeleton({ 
  columns = 7, 
  rows = 5, 
  showHeader = true,
  columnWidths = []
}: TableSkeletonProps) {
  // Default widths if not provided
  const widths = columnWidths.length === columns 
    ? columnWidths 
    : Array.from({ length: columns }).map((_, i) => {
        // Vary widths for more realistic skeleton
        const widths = ['w-32', 'w-24', 'w-28', 'w-20', 'w-16', 'w-24', 'w-20'];
        return widths[i % widths.length];
      });

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <table className="data-table">
        {showHeader && (
          <thead>
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i}>
                  <Skeleton className={`h-4 ${widths[i]}`} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex}>
                  {colIndex === 0 ? (
                    // First column often has avatar/icon, make it wider
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className={`h-4 ${widths[colIndex]}`} />
                    </div>
                  ) : (
                    <Skeleton className={`h-4 ${widths[colIndex]}`} />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

