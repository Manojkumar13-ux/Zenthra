// app/(main)/find-people/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  UserPlus,
  UserCheck,
  Loader2,
  Users,
  User,
  Mail,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface User {
  _id: string;
  name: string;
  username: string;
  image?: string | null;
  bio?: string;
  followersCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  online?: boolean;
  role?: string;
}

export default function FindPeoplePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<"all" | "suggested" | "following">("all");
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (search?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        
        let url = `/api/users/find?tab=${tab}`;
        if (search || searchQuery) {
          url += `&q=${encodeURIComponent(search || searchQuery)}`;
        }

        const res = await fetch(url);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch users");
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(error instanceof Error ? error.message : "Failed to load users");
      } finally {
        setIsLoading(false);
      }
    },
    [tab, searchQuery]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchUsers();
    }
  }, [session, status, router, tab, fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleFollow = async (userId: string) => {
    // Optimistic update
    setUsers(prev =>
      prev.map(user =>
        user._id === userId
          ? { ...user, isFollowing: !user.isFollowing }
          : user
      )
    );

    try {
      const user = users.find(u => u._id === userId);
      const isFollowing = user?.isFollowing;
      
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || (isFollowing ? "Unfollowed" : "Followed"));
        // Refresh to get updated counts
        fetchUsers();
      } else {
        // Revert optimistic update
        setUsers(prev =>
          prev.map(user =>
            user._id === userId
              ? { ...user, isFollowing: !user.isFollowing }
              : user
          )
        );
        toast.error("Failed to update follow status");
      }
    } catch (error) {
      console.error("Failed to follow/unfollow:", error);
      toast.error("Failed to update follow status");
      // Revert optimistic update
      setUsers(prev =>
        prev.map(user =>
          user._id === userId
            ? { ...user, isFollowing: !user.isFollowing }
            : user
        )
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-6 flex items-center gap-3">
        <UserPlus className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold">Find People</h1>
        <Badge variant="secondary" className="ml-2">
          {users.length} users
        </Badge>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name or username..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
        {searchQuery && (
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setSearchQuery("");
              fetchUsers("");
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b dark:border-gray-800">
        {[
          { value: "all", label: "All Users" },
          { value: "suggested", label: "Suggested" },
          { value: "following", label: "Following" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value as any)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              tab === t.value
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* User List */}
      {error ? (
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => fetchUsers()}>
            Try Again
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center">
          <UserPlus className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500">
            {searchQuery ? "No users found matching your search" : "No users found"}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {searchQuery
              ? "Try a different search term"
              : tab === "following"
              ? "You're not following anyone yet"
              : "Create an account or invite friends to join"}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                fetchUsers("");
              }}
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user._id}
              className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <Link href={`/profile/${user._id}`} className="flex-shrink-0">
                  <AvatarSimple
                    src={user.image}
                    fallback={user.name?.[0] || "U"}
                    alt={user.name}
                    size="lg"
                    className="h-14 w-14 text-lg"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${user._id}`}
                      className="font-semibold hover:text-blue-500 transition-colors truncate"
                    >
                      {user.name}
                    </Link>
                    {user.role === "admin" && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    {user.online && (
                      <Badge variant="default" className="text-xs bg-green-500">
                        Online
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                  {user.bio && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {user.bio}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {user.postsCount !== undefined && (
                      <span>{user.postsCount} posts</span>
                    )}
                    {user.followersCount !== undefined && (
                      <span>{user.followersCount} followers</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t dark:border-gray-800">
                <Button
                  size="sm"
                  variant={user.isFollowing ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-1",
                    user.isFollowing && "bg-green-500 hover:bg-green-600 text-white"
                  )}
                  onClick={() => handleFollow(user._id)}
                >
                  {user.isFollowing ? (
                    <UserCheck className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  {user.isFollowing ? "Following" : "Follow"}
                </Button>
                <Link href={`/messages?userId=${user._id}`}>
                  <Button variant="outline" size="sm" className="px-3">
                    <Mail className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}