// components/feed/FeedSkeleton.tsx
import { Card } from "@/components/ui/card";

interface FeedSkeletonProps {
  count?: number;
}

export default function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="animate-pulse p-4">
          <div className="flex items-start gap-3">
            {/* Avatar skeleton */}
            <div className="h-12 w-12 flex-shrink-0 rounded-full bg-muted/60" />

            <div className="flex-1 space-y-3">
              {/* Name and username skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 rounded bg-muted/60" />
                <div className="h-3 w-16 rounded bg-muted/40" />
                <div className="ml-auto h-3 w-8 rounded bg-muted/30" />
              </div>

              {/* Content skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-full rounded bg-muted/50" />
                <div className="h-4 w-3/4 rounded bg-muted/50" />
                <div className="h-4 w-1/2 rounded bg-muted/50" />
              </div>

              {/* Media skeleton */}
              <div className="h-48 w-full rounded-lg bg-muted/40" />

              {/* Action buttons skeleton */}
              <div className="flex items-center gap-6 pt-2">
                <div className="h-4 w-12 rounded bg-muted/40" />
                <div className="h-4 w-12 rounded bg-muted/40" />
                <div className="h-4 w-12 rounded bg-muted/40" />
                <div className="ml-auto h-4 w-12 rounded bg-muted/40" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
