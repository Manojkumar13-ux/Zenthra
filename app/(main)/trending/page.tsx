"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PostCard } from "@/components/posts/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Hash, 
  TrendingUp, 
  Flame, 
  Clock, 
  Sparkles,
  Users,
  Heart,
  MessageCircle,
  Repeat2,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

type TrendingTab = "trending" | "for-you" | "hashtags";

export default function TrendingPage() {
  const { data: session } = useSession();
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TrendingTab>("trending");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const res = await fetch("/api/trending");
      if (!res.ok) throw new Error("Failed to fetch trending");
      return res.json();
    },
  });

  // Extract all unique hashtags from posts
  const getAllHashtags = () => {
    const posts = data?.hashtagPosts || [];
    const hashtags = new Set<string>();
    posts.forEach((post: any) => {
      if (post.hashtags && Array.isArray(post.hashtags)) {
        post.hashtags.forEach((tag: string) => hashtags.add(tag));
      }
    });
    return Array.from(hashtags);
  };

  const allHashtags = getAllHashtags();

  const getFilteredPosts = () => {
    const posts = data?.hashtagPosts || [];
    if (selectedHashtag) {
      return posts.filter((post: any) => 
        post.hashtags?.includes(selectedHashtag)
      );
    }
    return posts;
  };

  const filteredPosts = getFilteredPosts();
  const trendingData = data?.trending || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24" />
          ))}
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  const postsToShow = activeTab === "for-you" 
    ? data?.recentPosts || []
    : activeTab === "trending"
      ? data?.trendingPosts || []
      : filteredPosts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Trending</h1>
        <Badge variant="outline" className="flex items-center gap-1">
          <Flame className="h-3 w-3 text-orange-500" />
          Live
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <Sparkles className="h-3 w-3" />
          AI Powered
        </Badge>
      </div>

      {/* Trending Hashtags - Shows all detected hashtags */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Trending Hashtags
          </h2>
          <Badge variant="outline" className="text-[10px]">
            {allHashtags.length} total
          </Badge>
        </div>
        
        {allHashtags.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">
            No hashtags detected yet. Use # in your posts!
          </div>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {allHashtags.map((tag) => {
              const trend = trendingData.find((t: any) => t.tag === tag);
              const count = trend?.count || 0;
              const isSelected = selectedHashtag === tag;

              return (
                <button
                  key={tag}
                  onClick={() => setSelectedHashtag(isSelected ? null : tag)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all",
                    isSelected
                      ? "bg-indigo-500 text-white border-indigo-500"
                      : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300"
                  )}
                >
                  <Hash className="h-3.5 w-3.5" />
                  <span className="text-sm font-medium">{tag}</span>
                  <Badge 
                    variant={isSelected ? "secondary" : "outline"} 
                    className="text-[10px]"
                  >
                    {count} posts
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={activeTab === "trending" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("trending")}
          className="rounded-full"
        >
          <Flame className="h-4 w-4 mr-1" />
          Trending
        </Button>
        <Button
          variant={activeTab === "for-you" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("for-you")}
          className="rounded-full"
        >
          <Sparkles className="h-4 w-4 mr-1" />
          For You
        </Button>
        <Button
          variant={activeTab === "hashtags" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("hashtags")}
          className="rounded-full"
        >
          <Hash className="h-4 w-4 mr-1" />
          Hashtags
        </Button>
        {selectedHashtag && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedHashtag(null)}
            className="rounded-full text-red-500"
          >
            Clear filter
          </Button>
        )}
      </div>

      {/* Posts */}
      <div>
        {selectedHashtag && (
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Hash className="h-5 w-5 text-indigo-500" />
              {selectedHashtag}
            </h2>
            <Badge variant="outline">{filteredPosts.length} posts</Badge>
          </div>
        )}

        {postsToShow.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
            {selectedHashtag ? (
              <>
                <Hash className="h-12 w-12 mx-auto text-gray-300" />
                <p className="text-gray-500 mt-3">No posts with {selectedHashtag}</p>
                <p className="text-sm text-gray-400">Try another hashtag or create a post!</p>
              </>
            ) : (
              <>
                <TrendingUp className="h-12 w-12 mx-auto text-gray-300" />
                <p className="text-gray-500 mt-3">No trending posts yet</p>
                <p className="text-sm text-gray-400">Posts with hashtags will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {postsToShow.map((post: any) => (
              <div key={post._id}>
                <PostCard post={post} />
                {/* Show hashtags below post */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2 px-4">
                    {post.hashtags.map((tag: string) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedHashtag(tag)}
                        className="text-sm text-indigo-500 hover:text-indigo-700 hover:underline"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}