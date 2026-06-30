// app/(main)/profile/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
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
  Image as ImageIcon,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
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
  isFollowing: boolean;
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

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "replies" | "media">("posts");
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!userId) {
        if (session?.user?.id) {
          router.push(`/profile/${session.user.id}`);
        } else {
          router.push("/feed");
        }
        return;
      }

      console.log("🔍 Fetching user profile for ID:", userId);
      
      const res = await fetch(`/api/users/${userId}`);
      console.log("📊 Response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("📊 Profile data:", data);
        setProfile(data.user);
        setIsFollowing(data.user.isFollowing || false);
        setIsCurrentUser(data.user._id === session?.user?.id);
      } else {
        const error = await res.json();
        console.error("❌ Error:", error);
        toast.error(error.error || "Failed to load profile");
        router.push("/feed");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && userId) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [status, userId]);

  const handleFollow = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(!isFollowing);
        setProfile(prev => prev ? {
          ...prev,
          followers: isFollowing ? prev.followers - 1 : prev.followers + 1,
          isFollowing: !isFollowing
        } : null);
        toast.success(data.message || (isFollowing ? "Unfollowed" : "Followed"));
      }
    } catch (error) {
      console.error("Failed to follow:", error);
      toast.error("Failed to update follow status");
    }
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
        <p className="text-gray-500 mt-2">Please sign in to view profiles</p>
        <Link
          href="/login"
          className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
          User not found
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          The user you're looking for doesn't exist
        </p>
        <Button
          onClick={() => fetchProfile()}
          className="mt-4"
        >
          <Loader2 className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
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
              <p className="text-sm">Cover photo</p>
            </div>
          </div>
        )}
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
          </div>
        </div>

        {/* Name and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mt-3 sm:mt-4">
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
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
          </div>

          <div className="flex items-center gap-2 mt-3 sm:mt-0">
            {isCurrentUser ? (
              <Link href="/settings">
                <Button variant="outline" size="sm">Edit Profile</Button>
              </Link>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={isFollowing ? "default" : "outline"}
                  className={cn(
                    "gap-1",
                    isFollowing && "bg-green-500 hover:bg-green-600 text-white"
                  )}
                  onClick={handleFollow}
                >
                  {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Link href={`/messages?userId=${profile._id}`}>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
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
          <p className="text-sm text-gray-500 mt-1">
            {isCurrentUser ? "Create your first post!" : "This user hasn't posted yet"}
          </p>
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
                <Button variant="ghost" size="icon" className="h-8 w-8">
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