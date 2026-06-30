// app/(main)/profile/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  Users,
  User,
  Loader2,
  Mail,
  UserPlus,
  UserCheck,
  Calendar,
  MapPin,
  Link2,
  Settings,
  Edit,
  Camera,
  Image as ImageIcon,
  X,
  Check,
  Save,
  PenSquare,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Profile {
  _id: string;
  name: string;
  username: string;
  email: string;
  image?: string;
  coverImage?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: string;
  followers: number;
  following: number;
  posts: number;
}

interface Post {
  _id: string;
  content: string;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked: boolean;
  hashtags?: string[];
  category?: string;
  author: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "media">("posts");
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // File upload refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      // ✅ Check if session exists
      if (!session?.user?.id) {
        console.log("No session user ID found");
        router.push("/login");
        return;
      }

      console.log("🔍 Fetching profile for user ID:", session.user.id);
      
      // ✅ Try to fetch from API
      const res = await fetch(`/api/users/${session.user.id}`);
      console.log("📊 Response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("📊 Profile data:", data);
        if (data.user) {
          setProfile(data.user);
          setEditName(data.user.name || "");
          setEditBio(data.user.bio || "");
          setEditLocation(data.user.location || "");
          setEditWebsite(data.user.website || "");
        } else {
          // ✅ If no user in response, use session data
          useSessionData();
        }
      } else {
        const error = await res.json();
        console.error("❌ Error response:", error);
        // ✅ Fallback to session data
        useSessionData();
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      // ✅ Fallback to session data
      useSessionData();
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Helper function to use session data as fallback
  const useSessionData = () => {
    if (session?.user) {
      console.log("Using session data as fallback");
      setProfile({
        _id: session.user.id,
        name: session.user.name || "User",
        username: session.user.username || session.user.email?.split("@")[0] || "user",
        email: session.user.email || "",
        image: session.user.image || "",
        bio: "",
        location: "",
        website: "",
        createdAt: new Date().toISOString(),
        followers: 0,
        following: 0,
        posts: 0,
      });
      setEditName(session.user.name || "");
    } else {
      router.push("/login");
    }
  };

  const fetchUserPosts = async () => {
    try {
      if (!session?.user?.id) return;
      
      console.log("🔍 Fetching posts for user ID:", session.user.id);
      
      const res = await fetch(`/api/users/${session.user.id}/posts`);
      if (res.ok) {
        const data = await res.json();
        console.log("📊 Posts data:", data.posts?.length || 0);
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();
      fetchUserPosts();
    }
  }, [status]);

  // ============================================
  // Profile Update Functions
  // ============================================
  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          location: editLocation,
          website: editWebsite,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, ...data.user } : null);
        setIsEditing(false);
        toast.success("Profile updated successfully!");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/users/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, image: data.imageUrl } : null);
        toast.success("Profile picture updated!");
      } else {
        toast.error("Failed to update profile picture");
      }
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast.error("Failed to upload avatar");
    }
    e.target.value = "";
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("cover", file);

      const res = await fetch("/api/users/profile/cover", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? { ...prev, coverImage: data.imageUrl } : null);
        toast.success("Cover photo updated!");
      } else {
        toast.error("Failed to update cover photo");
      }
    } catch (error) {
      console.error("Failed to upload cover:", error);
      toast.error("Failed to upload cover");
    }
    e.target.value = "";
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

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts(posts.filter(post => post._id !== postId));
        toast.success("Post deleted");
        setProfile(prev => prev ? { ...prev, posts: prev.posts - 1 } : null);
      } else {
        toast.error("Failed to delete post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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
        <p className="text-gray-500 mt-2">Please sign in to view your profile</p>
        <Link
          href="/login"
          className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Sign In
        </Link>
      </div>
    );
  }

  // ✅ Check if profile exists before rendering
  if (!profile) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          Loading profile...
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Please wait while we load your profile
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-blue-500 mx-auto mt-4" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={avatarInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleAvatarUpload}
      />
      <input
        type="file"
        ref={coverInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleCoverUpload}
      />

      {/* Cover Photo */}
      <div className="relative rounded-xl overflow-hidden h-48 md:h-56 lg:h-64 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 dark:from-blue-800 dark:via-purple-800 dark:to-pink-800">
        {profile.coverImage ? (
          <img 
            src={profile.coverImage} 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <div className="text-center text-white/60">
              <ImageIcon className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Add a cover photo</p>
            </div>
          </div>
        )}
        
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-lg px-3 py-1.5 text-xs flex items-center gap-2 transition-colors backdrop-blur-sm"
        >
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Change Cover</span>
        </button>
      </div>

      {/* Profile Info */}
      <div className="relative px-4 sm:px-6">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20">
          <div className="relative inline-block">
            <AvatarSimple
              src={profile.image}
              fallback={profile.name?.[0] || "U"}
              alt={profile.name}
              size="lg"
              className="h-24 w-24 sm:h-32 sm:w-32 text-3xl ring-4 ring-white dark:ring-gray-900"
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-blue-500 p-1.5 text-white hover:bg-blue-600 transition-colors ring-2 ring-white dark:ring-gray-900"
            >
              <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        {/* Name and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mt-3 sm:mt-4">
          <div>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-xl font-bold"
                  placeholder="Your name"
                />
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell us about yourself"
                  className="text-sm"
                  rows={2}
                />
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="Location"
                  className="text-sm"
                />
                <Input
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  placeholder="Website"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdateProfile} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <Badge variant="secondary" className="text-xs">You</Badge>
                </div>
                <p className="text-gray-500">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{profile.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                  {profile.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile.location}
                    </span>
                  )}
                  {profile.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                      <Link2 className="h-3.5 w-3.5" />
                      {profile.website}
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="gap-2"
              >
                <PenSquare className="h-4 w-4" />
                Edit Profile
              </Button>
              <Link href="/settings">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6 mt-4 pb-4 border-b dark:border-gray-800">
          <div className="text-center">
            <p className="text-lg font-bold">{profile.posts}</p>
            <p className="text-xs text-gray-500">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{profile.followers}</p>
            <p className="text-xs text-gray-500">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{profile.following}</p>
            <p className="text-xs text-gray-500">Following</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mt-4 border-b dark:border-gray-800">
        {["posts", "replies", "media"].map((tab) => (
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
            {tab === "posts" ? "Posts" : tab === "replies" ? "Replies" : "Media"}
          </button>
        ))}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No posts yet</h3>
          <p className="text-sm text-gray-500 mt-1">Create your first post to share with the world!</p>
          <Link href="/feed">
            <Button className="mt-4">Create Post</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {posts.map((post) => (
            <div key={post._id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4">
              {post.category && post.category !== "General" && (
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs">{post.category}</Badge>
                </div>
              )}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <AvatarSimple
                    src={post.author?.image || profile.image}
                    fallback={post.author?.name?.[0] || profile.name?.[0] || "U"}
                    alt={post.author?.name || profile.name}
                    size="md"
                  />
                  <div>
                    <Link href={`/profile/${post.author?._id || profile._id}`} className="font-semibold hover:underline">
                      {post.author?.name || profile.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>@{post.author?.username || profile.username}</span>
                      <span>·</span>
                      <span>{getTimeAgo(post.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleDeletePost(post._id)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {post.content?.split(/(#\w+)/g).map((part, index) => {
                    if (part.startsWith("#")) {
                      return (
                        <Link
                          key={index}
                          href={`/explore?q=${encodeURIComponent(part.slice(1))}`}
                          className="text-blue-500 hover:underline"
                        >
                          {part}
                        </Link>
                      );
                    }
                    return part;
                  })}
                </p>
                {post.image && (
                  <img src={post.image} alt="Post" className="mt-2 rounded-lg max-h-64 object-cover" />
                )}
                {post.video && (
                  <video src={post.video} controls className="mt-2 rounded-lg max-h-64" />
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-gray-800">
                <button
                  onClick={() => handleLike(post._id)}
                  className={cn(
                    "flex items-center gap-2 text-sm",
                    post.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                  )}
                >
                  <Heart className={cn("h-5 w-5", post.isLiked && "fill-current")} />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500">
                  <MessageCircle className="h-5 w-5" />
                  <span>{post.comments}</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-500">
                  <Share2 className="h-5 w-5" />
                  <span>{post.shares}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}