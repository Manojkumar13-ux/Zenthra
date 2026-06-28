// app/(main)/feed/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Sparkles, RefreshCw, AlertCircle, TrendingUp, Users, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type TabType = "for-you" | "following" | "trending" | "communities";

export default function FeedPage() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>("for-you");
  const { ref, inView } = useInView();
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
  } = useInfiniteQuery({
    queryKey: ["feed", tab],
    queryFn: async ({ pageParam = 1 }) => {
      try {
        console.log(`🔵 Fetching feed: tab=${tab}, page=${pageParam}`);
        
        const res = await fetch(`/api/feed?tab=${tab}&page=${pageParam}&limit=10`, {
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("🔴 Feed API Error:", errorData);
          throw new Error(errorData.error || "Failed to fetch feed");
        }
        
        const data = await res.json();
        console.log(`🟢 Feed API Success: ${data.posts?.length || 0} posts, total: ${data.pagination?.total || 0}`);
        return data;
      } catch (error) {
        console.error("❌ Feed fetch error:", error);
        throw error;
      }
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
    retry: 1,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allPosts = data?.pages?.flatMap((page) => page.posts || []) || [];
  const totalPosts = data?.pages?.[0]?.pagination?.total || 0;

  const handleTabChange = useCallback((value: string) => {
    setTab(value as TabType);
    queryClient.invalidateQueries({ queryKey: ["feed", value] });
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success("Feed refreshed!");
  }, [refetch]);

  const handlePostDeleted = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (status === "loading" || !mounted) {
    return <FeedSkeleton />;
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
  // MAIN FEED RENDER
  // ============================================
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Create Post */}
      <CreatePost onPostCreated={() => refetch()} />

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
              <Users className="h-4 w-4" />
              Communities
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          className="ml-2"
        >
          <RefreshCw className="h-4 w-4" />
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
          {isLoading && allPosts.length === 0 ? (
            <FeedSkeleton />
          ) : allPosts.length === 0 ? (
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
                {tab === "for-you" && "Create your first post or follow people to see their posts here!"}
                {tab === "following" && "Follow some people to see their posts here"}
                {tab === "trending" && "No trending posts yet. Create a post with #hashtags to start trending!"}
                {tab === "communities" && "Join communities to see posts from members"}
              </p>
              {tab === "trending" && (
                <p className="text-sm text-muted-foreground mt-2">
                  💡 Tip: Use #hashtags like #movie in your posts to appear in trending!
                </p>
              )}
              {tab === "for-you" && (
                <Button
                  onClick={() => handleTabChange("following")}
                  variant="outline"
                  className="mt-4"
                >
                  Check Following
                </Button>
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
                  key={post._id}
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