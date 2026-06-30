// app/(main)/explore/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  Loader2,
  Search,
  Hash,
  X,
  TrendingUp,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Post {
  _id: string;
  content: string;
  image?: string;
  video?: string;
  author: {
    _id: string;
    name: string;
    username: string;
    image?: string | null;
  } | null;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked: boolean;
  visibility: "everyone" | "followers" | "only-me";
  hashtags?: string[];
  category?: string;
}

interface TrendingHashtag {
  _id: string;
  tag: string;
  count: number;
}

const categories = [
  { name: "All", value: "all" },
  { name: "Movies", value: "movies" },
  { name: "Sports", value: "sports" },
  { name: "Technology", value: "technology" },
  { name: "Music", value: "music" },
  { name: "Gaming", value: "gaming" },
  { name: "Business", value: "business" },
  { name: "Education", value: "education" },
];

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState<"posts" | "hashtags" | "people">("posts");
  
  const hashtagParam = searchParams.get("q") || "";

  const handleHashtagClick = (tag: string) => {
    const cleanTag = tag.startsWith("#") ? tag.slice(1) : tag;
    router.push(`/explore?q=${encodeURIComponent(cleanTag)}`);
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      let url = "/api/posts?limit=50";
      if (selectedCategory !== "all") {
        url += `&category=${selectedCategory}`;
      }
      if (hashtagParam) {
        url += `&hashtag=${hashtagParam.replace("#", "")}`;
      }
      
      console.log("🔍 Fetching:", url);
      
      const postsRes = await fetch(url);
      if (postsRes.ok) {
        const data = await postsRes.json();
        console.log("📊 Posts found:", data.posts?.length || 0);
        setPosts(data.posts || []);
      } else {
        console.error("Failed to fetch posts");
        setPosts([]);
      }
      
      const hashtagsRes = await fetch("/api/hashtags/trending");
      if (hashtagsRes.ok) {
        const data = await hashtagsRes.json();
        setTrendingHashtags(data.hashtags || []);
      } else {
        setTrendingHashtags([
          { _id: "1", tag: "movie", count: 7 },
          { _id: "2", tag: "music", count: 5 },
          { _id: "3", tag: "tech", count: 4 },
          { _id: "4", tag: "gaming", count: 3 },
          { _id: "5", tag: "sports", count: 2 },
        ]);
      }
      
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load explore data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, hashtagParam]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const cleanQuery = searchQuery.trim().startsWith("#") 
        ? searchQuery.trim().slice(1) 
        : searchQuery.trim();
      router.push(`/explore?q=${encodeURIComponent(cleanQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !post.isLiked,
            }
          : post
      )
    );
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          Welcome to Zenthra
        </h2>
        <p className="text-gray-500 mt-2">Please sign in to explore</p>
        <Link
          href="/login"
          className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search posts, hashtags, people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
        
        {hashtagParam && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Hash className="h-3 w-3" />
              #{hashtagParam}
            </Badge>
            <button
              onClick={() => router.push("/explore")}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        {selectedCategory !== "all" && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              📂 {categories.find(c => c.value === selectedCategory)?.name}
            </Badge>
            <button
              onClick={() => setSelectedCategory("all")}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              selectedCategory === category.value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 mb-6 border-b dark:border-gray-800">
        {["posts", "hashtags", "people"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === tab
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {tab === "posts" ? "Posts" : tab === "hashtags" ? "Hashtags" : "People"}
          </button>
        ))}
      </div>

      {activeTab === "hashtags" && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Trending Hashtags
          </h3>
          {trendingHashtags.length === 0 ? (
            <p className="text-gray-500">No trending hashtags yet</p>
          ) : (
            trendingHashtags.map((hashtag) => (
              <button
                key={hashtag._id}
                onClick={() => handleHashtagClick(hashtag.tag)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">#{hashtag.tag}</span>
                </div>
                <Badge variant="secondary">
                  {hashtag.count} {hashtag.count === 1 ? "post" : "posts"}
                </Badge>
              </button>
            ))
          )}
        </div>
      )}

      {activeTab === "posts" && (
        <>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {hashtagParam ? `No posts found with #${hashtagParam}` : "No posts found"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {hashtagParam 
                  ? `Try a different hashtag or check the spelling` 
                  : "Create a post or explore different categories"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-2">
                {posts.length} {posts.length === 1 ? "post" : "posts"} found
              </div>
              {posts.map((post) => {
                if (!post?.author) return null;
                const author = post.author;
                return (
                  <div key={post._id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4">
                    {post.category && post.category !== "General" && (
                      <div className="mb-2">
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <AvatarSimple
                          src={author.image}
                          fallback={author.name?.[0] || "U"}
                          alt={author.name || "User"}
                          size="md"
                        />
                        <div>
                          <Link href={`/profile/${author._id}`} className="font-semibold text-gray-900 dark:text-white hover:underline">
                            {author.name || "Unknown User"}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>@{author.username || "user"}</span>
                            <span>·</span>
                            <span>{getTimeAgo(post.createdAt)}</span>
                            {post.visibility === "everyone" && <Globe className="h-3 w-3" />}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                        {post.content?.split(/(#\w+)/g).map((part, index) => {
                          if (part.startsWith("#")) {
                            const tag = part.slice(1);
                            return (
                              <button
                                key={index}
                                onClick={() => handleHashtagClick(tag)}
                                className="text-blue-500 hover:underline cursor-pointer"
                              >
                                {part}
                              </button>
                            );
                          }
                          return part;
                        })}
                      </p>
                      {post.image && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                          <img
                            src={post.image}
                            alt="Post image"
                            className="w-full max-h-64 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      {post.video && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                          <video
                            src={post.video}
                            controls
                            className="w-full max-h-64 rounded-lg"
                          />
                        </div>
                      )}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.hashtags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => handleHashtagClick(tag)}
                              className="text-xs text-blue-500 hover:underline bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full cursor-pointer"
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                      <span>{post.likes || 0} likes</span>
                      <span>{post.comments || 0} comments</span>
                      <span>{post.shares || 0} shares</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-gray-800">
                      <button
                        onClick={() => handleLike(post._id)}
                        className={cn(
                          "flex items-center gap-2 text-sm transition-colors",
                          post.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                        )}
                      >
                        <Heart className={cn("h-5 w-5", post.isLiked && "fill-current")} />
                        <span>{post.likes || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 transition-colors">
                        <MessageCircle className="h-5 w-5" />
                        <span>{post.comments || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-500 transition-colors">
                        <Share2 className="h-5 w-5" />
                        <span>{post.shares || 0}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "people" && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">👤</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            People Search Coming Soon
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Search and discover people to follow
          </p>
        </div>
      )}
    </div>
  );
}