// app/(main)/find-people/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Loader2 } from "lucide-react";
import UserCard from "@/components/shared/UserCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface User {
  _id: string;
  name: string;
  username: string;
  image?: string;
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
  const [tab, setTab] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(
    async (search?: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const url = new URL("/api/users/find", window.location.origin);
        url.searchParams.set("tab", tab);
        if (search || searchQuery) {
          url.searchParams.set("q", search || searchQuery);
        }

        const res = await fetch(url.toString());
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

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setUsers((prev) => prev.map((user) => (user._id === userId ? { ...user, isFollowing } : user)));
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
      </form>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="suggested">Suggested</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
      </Tabs>

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
          <p className="text-gray-500">No users found</p>
          <p className="mt-1 text-sm text-gray-400">
            Try searching for someone or explore suggestions
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard
              key={user._id}
              user={{
                ...user,
                followersCount: user.followersCount || 0,
                postsCount: user.postsCount || 0,
              }}
              variant="horizontal"
              showFollowButton={true}
              showMessageButton={true}
              showUnfollowButton={true}
              onFollowChange={handleFollowChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
