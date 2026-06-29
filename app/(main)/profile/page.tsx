// app/(main)/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Edit3,
  Share2,
  Heart,
  Bookmark,
  Loader2,
  Camera,
  Sparkles,
  Settings,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  const [user, setUser] = useState<UserProfile | null>(null);
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

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/users/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUser(data.user);
      setEditForm({
        name: data.user.name || "",
        bio: data.user.bio || "",
        location: data.user.location || "",
        website: data.user.website || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch("/api/users/posts");
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [session, status, router]);

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
      setUser((prev) => ({
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="animate-pulse">
          <div className="h-48 rounded-xl bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 flex items-center gap-4">
            <div className="h-24 w-24 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-6 w-32 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-1 h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-3xl p-4 text-center">
        <h1 className="mb-2 text-2xl font-bold">Profile</h1>
        <p className="text-gray-500">Please sign in to view your profile</p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600"
        >
          Sign In
        </a>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl p-4 text-center">
        <h1 className="mb-2 text-2xl font-bold">Profile</h1>
        <p className="text-gray-500">No user data available</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="mb-4 text-2xl font-bold">Profile</h1>
        <Button variant="outline" onClick={() => router.push("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <AvatarSimple src={user.image} fallback={user.name} alt={user.name} size="xl" />
          <button
            className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-1.5 text-white transition-colors hover:bg-blue-600"
            onClick={() => setIsEditing(true)}
          >
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <div className="flex flex-wrap items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                {user.name}
                {user.isVerified && <Badge className="bg-blue-500 text-white">Verified</Badge>}
              </h2>
              <p className="text-gray-500">@{user.username}</p>
            </div>
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>

          {user.bio && <p className="mt-3 text-sm">{user.bio}</p>}

          <div className="mt-3 flex flex-wrap gap-4">
            {user.location && (
              <span className="flex items-center gap-1 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                {user.location}
              </span>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-500 transition-colors hover:text-blue-600"
              >
                <LinkIcon className="h-4 w-4" />
                {user.website}
              </a>
            )}
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Joined{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="mt-4 flex gap-6">
            <div>
              <span className="font-semibold">{user.followersCount || 0}</span>
              <span className="ml-1 text-sm text-gray-500">Followers</span>
            </div>
            <div>
              <span className="font-semibold">{user.followingCount || 0}</span>
              <span className="ml-1 text-sm text-gray-500">Following</span>
            </div>
            <div>
              <span className="font-semibold">{user.postsCount || 0}</span>
              <span className="ml-1 text-sm text-gray-500">Posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Bio</label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Location</label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Website</label>
              <Input
                value={editForm.website}
                onChange={(e) => setEditForm((prev) => ({ ...prev, website: e.target.value }))}
              />
            </div>
            <Button onClick={handleUpdateProfile} className="w-full">
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "posts" | "likes" | "bookmarks")}
        className="mt-6"
      >
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1">
            Posts
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex-1">
            <Heart className="mr-2 h-4 w-4" />
            Likes
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="flex-1">
            <Bookmark className="mr-2 h-4 w-4" />
            Bookmarks
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts */}
      {activeTab === "posts" &&
        (posts.length === 0 ? (
          <div className="py-12 text-center">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-gray-500">No posts yet</p>
            <a href="/create-post" className="mt-2 inline-block text-blue-500 hover:underline">
              Create your first post
            </a>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {posts.map((post) => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        ))}

      {activeTab === "likes" && (
        <div className="py-12 text-center">
          <Heart className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-gray-500">No liked posts yet</p>
        </div>
      )}

      {activeTab === "bookmarks" && (
        <div className="py-12 text-center">
          <Bookmark className="mx-auto mb-2 h-8 w-8 text-gray-300" />
          <p className="text-gray-500">No bookmarked posts yet</p>
        </div>
      )}
    </div>
  );
}
