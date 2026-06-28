// components/feed/FeedSkeleton.tsx
import { Card } from "@/components/ui/card";

interface FeedSkeletonProps {
  count?: number;
}

export default function FeedSkeleton({ count = 3 }: FeedSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-4 animate-pulse">
          <div className="flex items-start gap-3">
            {/* Avatar skeleton */}
            <div className="w-12 h-12 rounded-full bg-muted/60 flex-shrink-0" />
            
            <div className="flex-1 space-y-3">
              {/* Name and username skeleton */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-muted/60 rounded" />
                <div className="h-3 w-16 bg-muted/40 rounded" />
                <div className="h-3 w-8 bg-muted/30 rounded ml-auto" />
              </div>
              
              {/* Content skeleton */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted/50 rounded" />
                <div className="h-4 w-3/4 bg-muted/50 rounded" />
                <div className="h-4 w-1/2 bg-muted/50 rounded" />
              </div>
              
              {/* Media skeleton */}
              <div className="h-48 w-full bg-muted/40 rounded-lg" />
              
              {/* Action buttons skeleton */}
              <div className="flex items-center gap-6 pt-2">
                <div className="h-4 w-12 bg-muted/40 rounded" />
                <div className="h-4 w-12 bg-muted/40 rounded" />
                <div className="h-4 w-12 bg-muted/40 rounded" />
                <div className="h-4 w-12 bg-muted/40 rounded ml-auto" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}