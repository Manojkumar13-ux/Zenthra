// app/profile/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  UserPlus,
  UserCheck,
  Settings,
  Mail,
  MessageCircle,
  Heart,
  Repeat2,
  Bookmark,
  Sparkles,
  Edit
} from "lucide-react";
// ✅ Fix: Import social icons correctly
import { FaTwitter, FaInstagram, FaYoutube, FaGithub } from "react-icons/fa";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// ✅ Fix: Import PostCard as default
import PostCard from "@/components/posts/PostCard";
import toast from "react-hot-toast";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const userId = params.id as string;
  const isOwnProfile = session?.user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsFollowing(data.user.isFollowing || false);
      } else {
        toast.error("User not found");
        router.push("/feed");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch(`/api/posts?userId=${userId}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!session) {
      toast.error("Please sign in to follow");
      return;
    }

    try {
      const action = isFollowing ? 'unfollow' : 'follow';
      const res = await fetch(`/api/users/${userId}/follow?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setIsFollowing(!isFollowing);
        toast.success(isFollowing ? "Unfollowed" : "Followed");
        fetchUserProfile();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update follow status");
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center">
        <h2 className="text-2xl font-bold mb-2">User not found</h2>
        <p className="text-gray-500">The user you're looking for doesn't exist.</p>
        <Link href="/feed" className="mt-4 inline-block text-blue-500 hover:underline">
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Back Button */}
      <Link href="/feed" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Link>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <AvatarSimple
              src={user.image}
              fallback={user.name}
              alt={user.name}
              size="xl"
            />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {user.name}
                  {user.isVerified && (
                    <Badge className="bg-blue-500 text-white">Verified</Badge>
                  )}
                </h1>
                <p className="text-gray-500">@{user.username}</p>
              </div>
              
              {/* Follow Button - Only show if not own profile */}
              {!isOwnProfile && session && (
                <Button
                  onClick={handleFollow}
                  variant={isFollowing ? "outline" : "default"}
                  className="gap-2"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              
              {/* If own profile, show Edit button linking to own profile */}
              {isOwnProfile && (
                <Button
                  onClick={() => router.push("/profile")}
                  variant="outline"
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {user.bio}
              </p>
            )}

            {/* Location & Website */}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {user.location}
                </span>
              )}
              {user.website && (
                <a 
                  href={user.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  {user.website.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Stats */}
            <div className="flex gap-6 mt-4">
              <div>
                <span className="font-bold">{user.followers?.length || 0}</span>
                <span className="text-gray-500 text-sm ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold">{user.following?.length || 0}</span>
                <span className="text-gray-500 text-sm ml-1">Following</span>
              </div>
              <div>
                <span className="font-bold">{user.stats?.postsCount || 0}</span>
                <span className="text-gray-500 text-sm ml-1">Posts</span>
              </div>
            </div>

            {/* Social Links */}
            {user.socialLinks && (
              <div className="flex gap-2 mt-3">
                {user.socialLinks.twitter && (
                  <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors">
                    <FaTwitter className="h-5 w-5" />
                  </a>
                )}
                {user.socialLinks.instagram && (
                  <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-pink-500 transition-colors">
                    <FaInstagram className="h-5 w-5" />
                  </a>
                )}
                {user.socialLinks.youtube && (
                  <a href={user.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-red-500 transition-colors">
                    <FaYoutube className="h-5 w-5" />
                  </a>
                )}
                {user.socialLinks.github && (
                  <a href={user.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-900 transition-colors">
                    <FaGithub className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-muted/50">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="replies" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Replies
            </TabsTrigger>
            <TabsTrigger value="media" className="flex items-center gap-2">
              <Repeat2 className="h-4 w-4" />
              Media
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Likes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
            {posts.length === 0 ? (
              <Card className="p-8 text-center">
                <Sparkles className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">No posts yet</p>
              </Card>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))
            )}
          </TabsContent>

          <TabsContent value="replies" className="mt-4">
            <Card className="p-8 text-center">
              <Heart className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No replies yet</p>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <Card className="p-8 text-center">
              <Repeat2 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No media yet</p>
            </Card>
          </TabsContent>

          <TabsContent value="likes" className="mt-4">
            <Card className="p-8 text-center">
              <Bookmark className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No liked posts yet</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}