// app/(main)/explore/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Search, 
  Users, 
  Hash, 
  TrendingUp,
  Loader2,
  Sparkles,
  X,
  Film,
  Music,
  Gamepad,
  Code,
  GraduationCap,
  Briefcase,
  Trophy
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import toast from "react-hot-toast";

type CategoryType = "all" | "movie" | "sports" | "technology" | "music" | "gaming" | "business" | "education";

const categoryIcons: Record<CategoryType, any> = {
  all: Sparkles,
  movie: Film,
  sports: Trophy,
  technology: Code,
  music: Music,
  gaming: Gamepad,
  business: Briefcase,
  education: GraduationCap,
};

const categoryColors: Record<CategoryType, string> = {
  all: "text-purple-500",
  movie: "text-red-500",
  sports: "text-green-500",
  technology: "text-blue-500",
  music: "text-pink-500",
  gaming: "text-orange-500",
  business: "text-yellow-500",
  education: "text-indigo-500",
};

export default function ExplorePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");
  
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [categoryPosts, setCategoryPosts] = useState([]);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetchTrendingHashtags();
    fetchCategoryPosts("all");
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      const res = await fetch("/api/explore/trending", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch trending");
      const data = await res.json();
      setTrendingHashtags(data.hashtags || []);
    } catch (error) {
      console.error("Error fetching trending:", error);
      toast.error("Failed to load trending");
    }
  };

  const fetchCategoryPosts = async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/explore?type=posts&category=${category}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch category posts");
      const data = await res.json();
      setCategoryPosts(data.results || []);
    } catch (error) {
      console.error("Error fetching category posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category as CategoryType);
    fetchCategoryPosts(category);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term");
      return;
    }
    
    setLoading(true);
    try {
      const postsRes = await fetch(`/api/explore?q=${encodeURIComponent(searchQuery)}&type=posts`, {
        credentials: "include",
      });
      const postsData = await postsRes.json();
      
      const hashtagsRes = await fetch(`/api/explore?q=${encodeURIComponent(searchQuery)}&type=hashtags`, {
        credentials: "include",
      });
      const hashtagsData = await hashtagsRes.json();
      
      setSearchResults({
        posts: postsData.results || [],
        hashtags: hashtagsData.results || [],
      });
      
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    } catch (error) {
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    router.push("/explore");
  };

  if (!mounted) {
    return <ExploreSkeleton />;
  }

  const categories: CategoryType[] = ["all", "movie", "sports", "technology", "music", "gaming", "business", "education"];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Search Bar */}
      <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 -mx-4 px-4 py-4 -mt-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for hashtags, users, or posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-24 h-12 rounded-full bg-muted/50 border-muted focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Button 
            type="submit" 
            size="sm" 
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>
      </div>

      {/* Categories */}
      {!searchResults && (
        <div className="space-y-4">
          <Tabs defaultValue="all" onValueChange={handleCategoryChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-muted/50">
              {categories.map((category) => {
                const Icon = categoryIcons[category];
                return (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="flex items-center gap-1 capitalize"
                  >
                    <Icon className={`h-4 w-4 ${categoryColors[category]}`} />
                    <span className="hidden sm:inline">{category}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {/* Category Posts */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : categoryPosts.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>No posts in {selectedCategory} category yet</p>
                <p className="text-sm mt-1">Create a post with relevant hashtags!</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {categoryPosts.map((post: any) => (
                  <Card key={post._id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.image} />
                        <AvatarFallback>{post.author?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{post.author?.name}</p>
                        <p className="text-xs text-muted-foreground">@{post.author?.username}</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {post.category || "general"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm">{post.content}</p>
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.hashtags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span>❤️ {post.likes?.length || 0}</span>
                      <span>💬 {post.comments?.length || 0}</span>
                      <span>🔄 {post.reposts?.length || 0}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && searchQuery && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Results for "{searchQuery}"</h2>
            <Button variant="ghost" size="sm" onClick={clearSearch}>
              Clear results
            </Button>
          </div>

          {searchResults.hashtags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {searchResults.hashtags.slice(0, 5).map((tag: any) => (
                  <Link key={tag.tag} href={`/explore?q=${tag.tag}`}>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      #{tag.tag} ({tag.count})
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {searchResults.posts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Posts</h3>
              <div className="space-y-3">
                {searchResults.posts.slice(0, 3).map((post: any) => (
                  <Card key={post._id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={post.author?.image} />
                        <AvatarFallback>{post.author?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{post.author?.name}</p>
                        <p className="text-xs text-muted-foreground">@{post.author?.username}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm line-clamp-2">{post.content}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {searchResults.hashtags.length === 0 && 
           searchResults.posts.length === 0 && (
            <Card className="p-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>No results found for "{searchQuery}"</p>
            </Card>
          )}
        </div>
      )}

      {/* Trending Hashtags */}
      {!searchResults && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Trending Hashtags
            </h2>
          </div>

          {trendingHashtags.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Hash className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p>No trending hashtags yet</p>
              <p className="text-sm mt-1">Create a post with hashtags to start trending!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trendingHashtags.slice(0, 8).map((tag: any, index: number) => (
                <motion.div
                  key={tag.tag || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/explore?q=${tag.tag}`}>
                    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                            index === 2 ? 'bg-gradient-to-br from-orange-600 to-orange-700' :
                            'bg-gradient-to-br from-blue-400 to-blue-500'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">#{tag.tag}</p>
                            <p className="text-xs text-muted-foreground">{tag.count} posts</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {tag.count}
                        </Badge>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExploreSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="h-12 w-full bg-muted rounded-full animate-pulse" />
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}