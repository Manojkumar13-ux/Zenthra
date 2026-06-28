"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  Plus,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

type Community = {
  _id: string;
  name: string;
  description: string;
  image?: string;
  isPrivate: boolean;
  members: string[];
  moderators: string[];
  owner: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  memberCount: number;
  isMember: boolean;
  isModerator: boolean;
  isOwner: boolean;
  createdAt: string;
};

export default function CommunitiesPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  // Fetch communities
  const { data: communities, isLoading, refetch } = useQuery({
    queryKey: ["communities", searchQuery],
    queryFn: async () => {
      const url = new URL("/api/communities", window.location.origin);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      const res = await fetch(url.toString(), {
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to fetch communities");
      }
      return res.json();
    },
    enabled: !!session,
  });

  // Create community mutation
  const createCommunityMutation = useMutation({
    mutationFn: async (data: typeof newCommunity) => {
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
    onError: (error: any) => {
      toast.error(error.message || "Failed to create community");
    },
  });

  // Join/Leave community mutation
  const joinCommunityMutation = useMutation({
    mutationFn: async ({ communityId, action }: { communityId: string; action: "join" | "leave" }) => {
      const res = await fetch(`/api/communities/${communityId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update membership");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      toast.success("Membership updated!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update membership");
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

  if (isLoading) {
    return <CommunitiesSkeleton />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="text-sm text-muted-foreground">
            Join communities to connect with like-minded people
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Community
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateCommunity}>
              <DialogHeader>
                <DialogTitle>Create Community</DialogTitle>
                <DialogDescription>
                  Create a new community for people to join and connect.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Community Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Tech Enthusiasts"
                    value={newCommunity.name}
                    onChange={(e) =>
                      setNewCommunity({ ...newCommunity, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your community..."
                    value={newCommunity.description}
                    onChange={(e) =>
                      setNewCommunity({
                        ...newCommunity,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="private">Private Community</Label>
                    <p className="text-sm text-muted-foreground">
                      Only members can see posts
                    </p>
                  </div>
                  <Switch
                    id="private"
                    checked={newCommunity.isPrivate}
                    onCheckedChange={(checked) =>
                      setNewCommunity({ ...newCommunity, isPrivate: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCommunityMutation.isPending}
                >
                  {createCommunityMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search communities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Communities Grid */}
      {!communities || communities.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No communities found</h3>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : "Be the first to create a community!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {communities.map((community: Community) => (
            <CommunityCard
              key={community._id}
              community={community}
              onJoinToggle={() =>
                joinCommunityMutation.mutate({
                  communityId: community._id,
                  action: community.isMember ? "leave" : "join",
                })
              }
              isPending={joinCommunityMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Community Card Component
function CommunityCard({
  community,
  onJoinToggle,
  isPending,
}: {
  community: Community;
  onJoinToggle: () => void;
  isPending: boolean;
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <Link href={`/communities/${community._id}`}>
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={community.image} />
            <AvatarFallback className="text-lg">
              {community.name?.charAt(0) || "C"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{community.name}</h3>
              {community.isPrivate ? (
                <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {community.description || "No description"}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {community.memberCount || 0} members
              </span>
              {community.isOwner && (
                <Badge variant="default" className="text-xs">
                  Owner
                </Badge>
              )}
              {community.isModerator && !community.isOwner && (
                <Badge variant="secondary" className="text-xs">
                  Moderator
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="mt-3 pt-3 border-t flex justify-end">
        <Button
          variant={community.isMember ? "outline" : "default"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onJoinToggle();
          }}
          disabled={isPending}
          className="gap-1"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : community.isMember ? (
            <>
              <UserCheck className="h-4 w-4" />
              Joined
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Join
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

// Skeleton Loader
function CommunitiesSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}