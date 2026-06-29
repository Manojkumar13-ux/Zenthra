// app/(main)/explore/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Search,
  Hash,
  Users,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PostCard from "@/components/posts/PostCard";
import Link from "next/link";
import toast from "react-hot-toast";

interface Post {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  hashtags: string[];
  media?: string[];
  liked?: boolean;
  bookmarked?: boolean;
  reposted?: boolean;
  viewsCount?: number;
  isPinned?: boolean;
}

interface User {
  _id: string;
  name: string;
  username: string;
  image?: string;
  bio?: string;
  followersCount: number;
  isFollowing: boolean;
}

interface Hashtag {
  tag: string;
  count: number;
}

type CategoryType =
  | "all"
  | "movie"
  | "sports"
  | "technology"
  | "music"
  | "gaming"
  | "business"
  | "education";

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

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "hashtags" | "users">("posts");
  const [category, setCategory] = useState<CategoryType>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const promises = [];
      const baseUrl = `/api/explore?q=${encodeURIComponent(searchQuery)}&category=${category}`;

      if (activeTab === "posts") {
        promises.push(
          fetch(`${baseUrl}&type=posts`).then((res) => {
            if (!res.ok) throw new Error("Failed to fetch posts");
            return res.json();
          })
        );
      }
      if (activeTab === "hashtags") {
        promises.push(
          fetch(`/api/explore?q=${encodeURIComponent(searchQuery)}&type=hashtags`).then(
            (res) => {
              if (!res.ok) throw new Error("Failed to fetch hashtags");
              return res.json();
            }
          )
        );
      }
      if (activeTab === "users") {
        promises.push(
          fetch(`/api/explore?q=${encodeURIComponent(searchQuery)}&type=users`).then(
            (res) => {
              if (!res.ok) throw new Error("Failed to fetch users");
              return res.json();
            }
          )
        );
      }

      const results = await Promise.allSettled(promises);

      let postIndex = 0;
      const hashtagIndex = activeTab === "hashtags" ? 1 : 0;
      const userIndex = activeTab === "users" ? 2 : 0;

      if (activeTab === "posts") {
        const result = results[postIndex++];
        if (result.status === "fulfilled") {
          setPosts(result.value.posts || []);
        }
      }
      if (activeTab === "hashtags") {
        const result = results[hashtagIndex];
        if (result.status === "fulfilled") {
          setHashtags(result.value.hashtags || []);
        }
      }
      if (activeTab === "users") {
        const result = results[userIndex];
        if (result.status === "fulfilled") {
          setUsers(result.value.users || []);
        }
      }
    } catch (err) {
      setError("Failed to fetch results. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "follow" }),
      });
      if (!res.ok) throw new Error("Failed to follow user");
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isFollowing: true } : user
        )
      );
      toast.success("User followed!");
    } catch (error) {
      toast.error("Failed to follow user");
      console.error(error);
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unfollow" }),
      });
      if (!res.ok) throw new Error("Failed to unfollow user");
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, isFollowing: false } : user
        )
      );
      toast.success("User unfollowed!");
    } catch (error) {
      toast.error("Failed to unfollow user");
      console.error(error);
    }
  };

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="animate-pulse rounded-full bg-muted p-4">
          <div className="h-12 rounded-full bg-muted/50" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search posts, hashtags, people..."
            className="h-12 rounded-full border-muted bg-muted/50 pl-10 pr-24"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            className="absolute right-1 top-1 rounded-full px-4"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </div>

        {/* Categories */}
        <div className="mt-3 flex flex-wrap gap-1">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              className="rounded-full text-xs"
              onClick={() => {
                setCategory(cat);
                if (searchQuery) handleSearch();
              }}
            >
              {categoryLabels[cat]}
            </Button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "posts" | "hashtags" | "users")}
      >
        <TabsList className="w-full bg-muted/50 lg:grid-cols-8">
          <TabsTrigger value="posts" className="flex-1">
            Posts
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="flex-1">
            Hashtags
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1">
            People
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={handleSearch}>
            Try Again
          </Button>
        </div>
      ) : activeTab === "posts" ? (
        posts.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No posts found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try searching for something else</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
              />
            ))}
          </div>
        )
      ) : activeTab === "hashtags" ? (
        hashtags.length === 0 ? (
          <div className="py-12 text-center">
            <Hash className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No hashtags found</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((hashtag) => (
              <Link
                key={hashtag.tag}
                href={`/explore?q=${hashtag.tag}`}
                className="inline-flex items-center gap-2 rounded-full bg-muted/50 px-3 py-1 text-sm hover:bg-muted"
              >
                <Hash className="h-3 w-3" />
                <span>{hashtag.tag}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {hashtag.count}
                </Badge>
              </Link>
            ))}
          </div>
        )
      ) : users.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {users.map((user) => (
            <Card
              key={user._id}
              className="cursor-pointer p-4 transition-shadow hover:bg-muted/50 hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${user._id}`}>
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.image} />
                      <AvatarFallback>
                        {user.name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/profile/${user._id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {user.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {user.bio}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {user.followersCount || 0} followers
                    </p>
                  </div>
                  {session?.user?.id !== user._id && (
                    <Button
                      variant={user.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() =>
                        user.isFollowing
                          ? handleUnfollow(user._id)
                          : handleFollow(user._id)
                      }
                    >
                      {user.isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}