// app/(main)/profile/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Settings,
  Edit3,
  Share2,
  Heart,
  Bookmark,
  Loader2,
  Camera,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import PostCard from "@/components/posts/PostCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import Image from "next/image";

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  email: string;
  image?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  followers: string[];
  following: string[];
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  createdAt: string;
}

interface Post {
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
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  liked: boolean;
  bookmarked: boolean;
  reposted: boolean;
  media: string[];
  hashtags: string[];
  mood?: string;
  category?: string;
  viewsCount: number;
  isPinned: boolean;
  aiSummary?: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  });
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "bookmarks">("posts");
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch profile");
      }
      const data = await res.json();
      setProfile(data.user);
      setEditForm({
        name: data.user.name || "",
        bio: data.user.bio || "",
        location: data.user.location || "",
        website: data.user.website || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/${userId}/posts`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (userId) {
      fetchProfile();
      fetchPosts();
    }
  }, [userId, status, router, fetchProfile, fetchPosts]);

  const handleFollow = async () => {
    if (!session) return;
    setIsFollowLoading(true);
    try {
      const action = profile?.isFollowing ? "unfollow" : "follow";
      const res = await fetch(`/api/users/${userId}/follow?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update follow");
      }
      const data = await res.json();
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isFollowing: data.isFollowing,
          followersCount: data.isFollowing
            ? prev.followersCount + 1
            : prev.followersCount - 1,
        };
      });
      toast.success(data.isFollowing ? "Followed!" : "Unfollowed!");
    } catch (error) {
      console.error("Error updating follow:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update follow");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update profile");
      }
      const data = await res.json();
      setProfile((prev) => ({
        ...prev!,
        name: data.user.name,
        bio: data.user.bio,
        location: data.user.location,
        website: data.user.website,
      }));
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
    toast.success("Post deleted");
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="animate-pulse">
          <div className="h-48 w-full rounded-xl bg-muted" />
          <div className="mt-4 flex items-center gap-4">
            <div className="h-24 w-24 rounded-full bg-muted" />
            <div className="flex-1">
              <div className="h-6 w-32 rounded bg-muted" />
              <div className="mt-1 h-4 w-24 rounded bg-muted" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
          <div className="mt-6 flex gap-4">
            <div className="h-10 w-20 rounded bg-muted" />
            <div className="h-10 w-20 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl p-4 text-center">
        <p className="text-muted-foreground">User not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      {/* Cover Image */}
      <div className="relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-500">
        {profile.coverImage ? (
          <Image
            src={profile.coverImage}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/30">
            <Camera className="h-12 w-12" />
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={profile.image} />
            <AvatarFallback className="text-2xl">
              {profile.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{profile.followersCount} followers</span>
              <span>{profile.followingCount} following</span>
              <span>{profile.postsCount} posts</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {profile.isOwnProfile ? (
            <>
              <Button variant="outline" onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Bio</label>
                      <Textarea
                        value={editForm.bio}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                        }
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        value={editForm.location}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, location: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Website</label>
                      <Input
                        value={editForm.website}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, website: e.target.value }))
                        }
                      />
                    </div>
                    <Button onClick={handleUpdateProfile} className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button
              variant={profile.isFollowing ? "outline" : "default"}
              onClick={handleFollow}
              disabled={isFollowLoading}
            >
              {isFollowLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : profile.isFollowing ? (
                "Following"
              ) : (
                "Follow"
              )}
            </Button>
          )}
          <Button variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bio & Info */}
      <div className="space-y-2">
        {profile.bio && <p className="text-sm">{profile.bio}</p>}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {profile.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
            >
              <LinkIcon className="h-4 w-4" />
              {profile.website}
            </a>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "posts" | "likes" | "bookmarks")}
      >
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1">
            Posts
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex-1">
            <Heart className="mr-2 h-4 w-4" />
            Likes
          </TabsTrigger>
          {profile.isOwnProfile && (
            <TabsTrigger value="bookmarks" className="flex-1">
              <Bookmark className="mr-2 h-4 w-4" />
              Bookmarks
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="py-12 text-center">
          <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-2 text-muted-foreground">
            {activeTab === "posts"
              ? "No posts yet"
              : activeTab === "likes"
              ? "No liked posts"
              : "No bookmarked posts"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={() => handleDeletePost(post._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}