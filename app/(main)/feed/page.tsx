// app/(main)/feed/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import CreatePost from "@/components/posts/CreatePost";
import PostCard from "@/components/posts/PostCard";
import FeedSkeleton from "@/components/feed/FeedSkeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Loader2,
  Globe
} from "lucide-react";
import toast from "react-hot-toast";

type TabType = "for-you" | "following" | "trending" | "communities";
type CategoryType = "all" | "movie" | "sports" | "technology" | "music" | "gaming" | "business" | "education";

const categories: { value: CategoryType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "sports", label: "Sports" },
  { value: "technology", label: "Technology" },
  { value: "music", label: "Music" },
  { value: "gaming", label: "Gaming" },
  { value: "business", label: "Business" },
  { value: "education", label: "Education" },
];

export default function FeedPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>("for-you");
  const [category, setCategory] = useState<CategoryType>("all");
  const { ref, inView } = useInView({ threshold: 0.1 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["feed", tab, category],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(
        `/api/feed?tab=${tab}&category=${category}&page=${pageParam}&limit=10`,
        {
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch feed: ${res.status}`);
      }
      
      const data = await res.json();
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasNext) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: status === "authenticated" && mounted,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = useMemo(() => {
    return data?.pages?.flatMap((page) => page.posts || []) || [];
  }, [data]);

  const totalPosts = useMemo(() => {
    return data?.pages?.[0]?.pagination?.total || 0;
  }, [data]);

  const handleTabChange = useCallback((value: string) => {
    setTab(value as TabType);
    queryClient.invalidateQueries({ queryKey: ["feed", value, category] });
  }, [queryClient, category]);

  const handleCategoryChange = useCallback((value: CategoryType) => {
    setCategory(value);
    queryClient.invalidateQueries({ queryKey: ["feed", tab, value] });
  }, [queryClient, tab]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Feed refreshed!");
  }, [refetch]);

  const handlePostCreated = useCallback(() => {
    refetch();
  }, [refetch]);

  const handlePostDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (status === "loading" || !mounted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-[120px] bg-muted/20 rounded-xl animate-pulse" />
        <div className="h-[50px] bg-muted/20 rounded-lg animate-pulse" />
        <FeedSkeleton count={3} />
      </div>
    );
  }

  // ============================================
  // UNAUTHENTICATED STATE
  // ============================================
  if (status === "unauthenticated") {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20">
              <Sparkles className="h-12 w-12 text-blue-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Welcome to Zenthra</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Sign in to connect with friends, share your thoughts, and discover amazing content.
          </p>
          <Button 
            onClick={() => window.location.href = "/login"} 
            className="gap-2"
            size="lg"
          >
            Sign In
            <Sparkles className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (isError) {
    console.error("❌ Feed error state:", error);
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Failed to load feed"}
          </p>
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </Card>
      </div>
    );
  }

  // ============================================
  // MAIN FEED RENDER - ✅ SEARCH BAR REMOVED
  // ============================================
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Categories - ✅ No search bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={category === cat.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(cat.value)}
            className="rounded-full text-sm whitespace-nowrap capitalize"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Feed Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            <TabsTrigger value="for-you" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              For You
            </TabsTrigger>
            <TabsTrigger value="following" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Following
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="communities" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Communities
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="ml-2"
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Feed Content */}
      <div>
        {totalPosts > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            {totalPosts} {totalPosts === 1 ? "post" : "posts"} found
          </p>
        )}

        <AnimatePresence mode="wait">
          {allPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16 bg-card rounded-xl shadow-sm border"
            >
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-muted/50">
                  <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts to show</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {category !== "all" ? (
                  <>No posts in <span className="font-medium">{category}</span> category yet.<br />Create a post with relevant hashtags!</>
                ) : tab === "for-you" ? (
                  "Create your first post or follow people to see their posts here!"
                ) : tab === "following" ? (
                  "Follow some people to see their posts here"
                ) : tab === "trending" ? (
                  "No trending posts yet. Create a post with #hashtags to start trending!"
                ) : (
                  "Join communities to see posts from members"
                )}
              </p>
              {category !== "all" && (
                <p className="text-sm text-muted-foreground mt-4">
                  💡 Tip: Use #{category} in your posts to appear in this category!
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="space-y-4"
            >
              {allPosts.map((post: any, index: number) => (
                <motion.div
                  key={post._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <PostCard 
                    post={post} 
                    onDelete={handlePostDeleted}
                  />
                </motion.div>
              ))}
              
              <div ref={ref} className="h-10" />
              
              {isFetchingNextPage && (
                <div className="space-y-4">
                  <FeedSkeleton count={2} />
                </div>
              )}
              
              {!hasNextPage && allPosts.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  You've reached the end of the feed 🎉
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}