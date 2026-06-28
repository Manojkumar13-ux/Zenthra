// components/shared/RightSidebar.tsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users, TrendingUp, Hash, UserCheck, UserPlus, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

export default function RightSidebar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch trending hashtags
      const trendingRes = await fetch("/api/explore/trending", {
        credentials: "include",
        cache: 'no-store'
      });
      if (trendingRes.ok) {
        const trendingData = await trendingRes.json();
        setTrendingHashtags(trendingData.hashtags || []);
      }

      // Fetch suggested users
      const usersRes = await fetch("/api/users/suggested", {
        credentials: "include",
        cache: 'no-store'
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setSuggestedUsers(usersData.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch sidebar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [status]);

  // Refresh data when posts are created (polling)
  useEffect(() => {
    if (status !== "authenticated") return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [status]);

  // ============================================
  // FOLLOW HANDLER
  // ============================================
  const handleFollow = async (userId: string, userName: string) => {
    if (!session) {
      toast.error("Please login to follow users");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await fetch(`/api/users/${userId}/follow?action=follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to follow");
      }

      setSuggestedUsers((prevUsers: any[]) =>
        prevUsers.map((user: any) =>
          user._id === userId
            ? { 
                ...user, 
                isFollowing: true,
                followersCount: (user.followersCount || 0) + 1
              }
            : user
        )
      );

      toast.success(data.message || `Following ${userName}`);
    } catch (error) {
      console.error("Follow error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to follow user");
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  // ============================================
  // UNFOLLOW HANDLER
  // ============================================
  const handleUnfollow = async (userId: string, userName: string) => {
    if (!session) {
      toast.error("Please login to unfollow");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [userId]: true }));

    try {
      const res = await fetch(`/api/users/${userId}/follow?action=unfollow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to unfollow");
      }

      setSuggestedUsers((prevUsers: any[]) =>
        prevUsers.map((user: any) =>
          user._id === userId
            ? { 
                ...user, 
                isFollowing: false,
                followersCount: Math.max((user.followersCount || 0) - 1, 0)
              }
            : user
        )
      );

      toast.success(data.message || `Unfollowed ${userName}`);
    } catch (error) {
      console.error("Unfollow error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to unfollow user");
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }));
    }
  };

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border h-[200px] animate-pulse" />
        <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border h-[200px] animate-pulse" />
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border">
        <h3 className="font-semibold mb-2">Welcome to Zenthra!</h3>
        <p className="text-sm text-gray-500 mb-4">
          Sign in to connect with others and discover amazing content.
        </p>
        <Button
          onClick={() => router.push("/login")}
          className="w-full"
        >
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Trending Hashtags */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-orange-500" />
          <h3 className="font-semibold">Trending</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : trendingHashtags.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            <Hash className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>No trending hashtags yet</p>
            <p className="text-xs mt-1">Posts with #hashtags will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trendingHashtags.slice(0, 5).map((tag: any, index: number) => (
              <Link
                key={tag.tag || index}
                href={`/explore?q=${tag.tag}`}
                className="flex items-center justify-between p-2 hover:bg-muted rounded-lg transition-colors"
                onClick={() => {
                  // Close any open menus
                }}
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">#{tag.tag}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {tag.count} posts
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Suggested Users */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Suggested for you
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => router.push("/find-people")}
          >
            View all
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="text-center py-4 text-sm text-gray-500">
            No suggestions available
          </div>
        ) : (
          <div className="space-y-2">
            {suggestedUsers.slice(0, 5).map((user: any) => {
              const isFollowing = user.isFollowing || false;
              const isLoading = loadingStates[user._id] || false;
              
              return (
                <div 
                  key={user._id} 
                  className="flex items-center gap-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 px-2 rounded-lg transition-colors"
                >
                  <Link href={`/profile/${user._id}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.image} />
                      <AvatarFallback>{user.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user._id}`} className="hover:underline">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                    </Link>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    <p className="text-xs text-gray-400">
                      {user.followersCount || 0} followers
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!isFollowing && (
                      <Button
                        variant="default"
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => handleFollow(user._id, user.name)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                    
                    {isFollowing && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 px-3 text-xs"
                        onClick={() => handleUnfollow(user._id, user.name)}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <UserX className="h-3 w-3 mr-1" />
                            Unfollow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}