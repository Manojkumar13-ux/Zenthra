// app/(main)/feed/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import PostCard from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import toast from "react-hot-toast";

type CategoryType =
  | "all"
  | "movie"
  | "sports"
  | "technology"
  | "music"
  | "gaming"
  | "business"
  | "education";

type TabType = "for-you" | "following" | "trending" | "communities";

interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    username: string;
    image?: string;
    isFollowing?: boolean;
    verified?: boolean;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  liked: boolean;
  bookmarked: boolean;
  reposted: boolean;
  media: string[];
  hashtags: string[];
  mood?: string;
  category?: string;
  viewsCount: number;
  isPinned: boolean;
  aiSummary?: string;
}

export default function FeedPage() {
  const { status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>("for-you");
  const [category, setCategory] = useState<CategoryType>("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const {
    data: posts,
    isLoading,
    error,
    refetch,
  } = useQuery<Post[]>({
    queryKey: ["feed", tab, category],
    queryFn: async () => {
      const url = new URL("/api/feed", window.location.origin);
      url.searchParams.set("tab", tab);
      if (category !== "all") {
        url.searchParams.set("category", category);
      }
      const res = await fetch(url.toString());
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch feed");
      }
      return res.json();
    },
    enabled: status === "authenticated",
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["feed", tab, category] });
    refetch();
    toast.success("Feed refreshed!");
  };

  const handlePostDeleted = (postId: string) => {
    queryClient.setQueryData<Post[]>(["feed", tab, category], (oldData) => {
      if (!oldData) return oldData;
      return oldData.filter((post) => post._id !== postId);
    });
  };

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="animate-pulse rounded-xl bg-muted/20 p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        <div className="mt-4 animate-pulse rounded-lg bg-muted/20 p-4">
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-4xl p-4 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-blue-50 p-4">
            <Sparkles className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <h1 className="mb-4 text-2xl font-bold">Welcome to Zenthra</h1>
        <p className="mx-auto mb-6 max-w-sm text-muted-foreground">
          Sign in to see personalized content and connect with others.
        </p>
        <Button onClick={() => (window.location.href = "/login")} className="gap-2" size="lg">
          Get Started
        </Button>
      </div>
    );
  }

  const categories: CategoryType[] = [
    "all",
    "movie",
    "sports",
    "technology",
    "music",
    "gaming",
    "business",
    "education",
  ];

  const categoryLabels: Record<CategoryType, string> = {
    all: "All",
    movie: "Movies",
    sports: "Sports",
    technology: "Technology",
    music: "Music",
    gaming: "Gaming",
    business: "Business",
    education: "Education",
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">Feed</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabType)} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="for-you" className="flex-1">
            For You
          </TabsTrigger>
          <TabsTrigger value="following" className="flex-1">
            Following
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex-1">
            Trending
          </TabsTrigger>
          <TabsTrigger value="communities" className="flex-1">
            Communities
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Categories */}
      <div className="scrollbar-hide flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={category === cat ? "default" : "outline"}
            size="sm"
            className="whitespace-nowrap rounded-full text-sm"
            onClick={() => setCategory(cat)}
          >
            {categoryLabels[cat]}
          </Button>
        ))}
      </div>

      {/* Feed Content */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-muted/20 p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card py-16 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-muted/50 p-4">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-semibold">Something went wrong</h3>
          <p className="mx-auto max-w-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load feed"}
          </p>
          <Button variant="outline" className="mt-4" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-muted/50 p-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-semibold">No posts yet</h3>
          <p className="mx-auto max-w-sm text-muted-foreground">
            {category === "all"
              ? "No posts in your feed yet. Follow users or join communities to see content!"
              : `No posts in ${category} category yet. Create a post with relevant hashtags!`}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => router.push("/explore")}>
              Explore
            </Button>
            <Button onClick={() => router.push("/create-post")}>Create Post</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} onDelete={() => handlePostDeleted(post._id)} />
          ))}
          <div className="py-8 text-center text-sm text-muted-foreground">
            You've reached the end of your feed
          </div>
        </div>
      )}
    </div>
  );
}
