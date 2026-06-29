// app/(main)/communities/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, UserPlus, UserCheck, Search, Plus, Globe, Lock, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface Community {
  _id: string;
  name: string;
  description: string;
  image?: string;
  coverImage?: string;
  isPrivate: boolean;
  members: string[];
  admins: string[];
  posts: string[];
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  isMember: boolean;
  isAdmin: boolean;
}

interface CreateCommunityData {
  name: string;
  description: string;
  isPrivate: boolean;
}

export default function CommunitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "member" | "admin">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState<CreateCommunityData>({
    name: "",
    description: "",
    isPrivate: false,
  });

  const { data: communities, isLoading } = useQuery<Community[]>({
    queryKey: ["communities", filter, searchQuery],
    queryFn: async () => {
      const url = new URL("/api/communities", window.location.origin);
      url.searchParams.set("filter", filter);
      if (searchQuery) {
        url.searchParams.set("search", searchQuery);
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch communities");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  const createCommunityMutation = useMutation({
    mutationFn: async (data: CreateCommunityData) => {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create community");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      setIsCreateDialogOpen(false);
      setNewCommunity({ name: "", description: "", isPrivate: false });
      toast.success("Community created successfully!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create community");
    },
  });

  const joinCommunityMutation = useMutation({
    mutationFn: async ({
      communityId,
      action,
    }: {
      communityId: string;
      action: "join" | "leave";
    }) => {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || `Failed to ${action} community`);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success(
        variables.action === "join"
          ? "Joined community successfully!"
          : "Left community successfully!"
      );
    },
    onError: (error: Error, variables) => {
      toast.error(error.message || `Failed to ${variables.action} community`);
    },
  });

  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunity.name.trim()) {
      toast.error("Community name is required");
      return;
    }
    createCommunityMutation.mutate(newCommunity);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-5xl p-4 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mb-2 text-lg font-semibold">No communities</h2>
        <p className="mb-4 text-muted-foreground">Sign in to view communities</p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    );
  }

  const filteredCommunities = communities?.filter((community) => {
    if (filter === "member") return community.isMember;
    if (filter === "admin") return community.isAdmin;
    return true;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-sm text-muted-foreground">
            Join communities that match your interests
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Community</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Community Name</label>
                <Input
                  placeholder="Enter community name"
                  value={newCommunity.name}
                  onChange={(e) =>
                    setNewCommunity((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your community"
                  value={newCommunity.description}
                  onChange={(e) =>
                    setNewCommunity((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newCommunity.isPrivate}
                  onChange={(e) =>
                    setNewCommunity((prev) => ({
                      ...prev,
                      isPrivate: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isPrivate" className="text-sm">
                  Private community (members need approval)
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={createCommunityMutation.isPending}>
                {createCommunityMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Community"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "member" | "admin")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="member">Member</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Communities List */}
      {!filteredCommunities || filteredCommunities.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-lg font-semibold">No communities found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `No communities matching "${searchQuery}"`
              : filter === "member"
                ? "You haven't joined any communities yet"
                : filter === "admin"
                  ? "You don't admin any communities"
                  : "Create your first community!"}
          </p>
          {!searchQuery && filter === "all" && (
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Community
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCommunities.map((community) => (
            <Card key={community._id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={community.image} />
                    <AvatarFallback>{community.name?.charAt(0) || "C"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{community.name}</h3>
                      {community.isPrivate ? (
                        <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                      ) : (
                        <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {community.description || "No description"}
                    </p>
                    <div className="mt-2 flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        {community.memberCount || 0} members
                      </span>
                      {community.isAdmin && (
                        <Badge variant="secondary" className="text-[10px]">
                          Admin
                        </Badge>
                      )}
                      {community.isMember && (
                        <Badge variant="outline" className="text-[10px]">
                          Member
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end border-t pt-3">
                    {community.isMember ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          joinCommunityMutation.mutate({
                            communityId: community._id,
                            action: "leave",
                          })
                        }
                        disabled={joinCommunityMutation.isPending}
                      >
                        <UserCheck className="mr-2 h-4 w-4" />
                        Leave
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          joinCommunityMutation.mutate({
                            communityId: community._id,
                            action: "join",
                          })
                        }
                        disabled={joinCommunityMutation.isPending}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
