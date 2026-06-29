// app/(main)/bookmarks/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import PostCard from "@/components/posts/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface BookmarkedPost {
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
}

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchBookmarks();
    }
  }, [session, status, router]);

  const fetchBookmarks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/bookmarks");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch bookmarks");
      }
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      setError(error instanceof Error ? error.message : "Failed to load bookmarks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = (postId: string) => {
    setBookmarks((prev) => prev.filter((post) => post._id !== postId));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchBookmarks}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6 flex items-center gap-3">
        <Bookmark className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <span className="text-sm text-gray-500">({bookmarks.length})</span>
      </div>

      {bookmarks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bookmark className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500">No bookmarks yet</p>
            <p className="mt-1 text-sm text-gray-400">Save posts you want to read later</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((post) => (
            <PostCard
              key={post._id}
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
                bookmarked: true,
                reposted: post.reposted || false,
                media: post.media || [],
                hashtags: post.hashtags || [],
                viewsCount: post.viewsCount || 0,
                isPinned: post.isPinned || false,
              }}
              onDelete={() => handleRemoveBookmark(post._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}