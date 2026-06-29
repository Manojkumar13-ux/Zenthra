// app/(main)/trending/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TrendingUp, Hash, Loader2, Flame, Sparkles, Clock } from "lucide-react";
import PostCard from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface TrendingPost {
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
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  liked?: boolean;
  bookmarked?: boolean;
  reposted?: boolean;
  media?: string[];
  hashtags?: string[];
  mood?: string;
  category?: string;
  viewsCount?: number;
  isPinned?: boolean;
  aiSummary?: string;
  trendingScore?: number;
}

export default function TrendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    fetchTrendingPosts();
  }, [session, status, router, timeRange]);

  const fetchTrendingPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/trending?range=${timeRange}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch trending posts");
      }
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching trending posts:", error);
      setError(error instanceof Error ? error.message : "Failed to load trending posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-8 w-8 text-orange-500" />
          <h1 className="text-2xl font-bold">Trending</h1>
          <Badge variant="secondary" className="text-xs">
            <Flame className="mr-1 h-3 w-3" />
            Live
          </Badge>
        </div>
      </div>

      {/* Time Range Tabs */}
      <Tabs
        value={timeRange}
        onValueChange={(v) => setTimeRange(v as "today" | "week" | "month")}
      >
        <TabsList className="w-full">
          <TabsTrigger value="today" className="flex-1">
            Today
          </TabsTrigger>
          <TabsTrigger value="week" className="flex-1">
            This Week
          </TabsTrigger>
          <TabsTrigger value="month" className="flex-1">
            This Month
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Trending Posts */}
      {error ? (
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchTrendingPosts}>
            Try Again
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-2 text-muted-foreground">No trending posts right now</p>
          <p className="text-sm text-muted-foreground">Check back later!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={post._id} className="relative">
              {index < 3 && (
                <div className="absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-yellow-500 text-xs font-bold text-white shadow-lg">
                  {index + 1}
                </div>
              )}
              <div className="ml-4">
                <PostCard
                  post={{
                    ...post,
                    _id: post._id,
                    author: {
                      ...post.author,
                      _id: post.author._id,
                      isFollowing: post.author.isFollowing || false,
                      verified: post.author.verified || false,
                    },
                    likesCount: post.likesCount || 0,
                    commentsCount: post.commentsCount || 0,
                    repostsCount: post.repostsCount || 0,
                    liked: post.liked || false,
                    bookmarked: post.bookmarked || false,
                    reposted: post.reposted || false,
                    media: post.media || [],
                    hashtags: post.hashtags || [],
                    viewsCount: post.viewsCount || 0,
                    isPinned: post.isPinned || false,
                  }}
                  onDelete={() => handleDeletePost(post._id)}
                />
                {post.trendingScore && (
                  <div className="mt-1 flex items-center gap-2 text-xs text-orange-500">
                    <Flame className="h-3 w-3" />
                    <span>Trending Score: {post.trendingScore}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}