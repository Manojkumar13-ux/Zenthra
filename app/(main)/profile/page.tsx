// app/(main)/profile/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Calendar,
  MapPin,
  Globe,
  Edit,
  Camera,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Sparkles,
  Loader2,
  UserPlus,
  UserCheck,
  Share2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";
import PostCard from "@/components/posts/PostCard";

type ProfileTab = "posts" | "replies" | "media" | "likes";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [coverImage, setCoverImage] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    username: "",
    location: "",
    website: "",
    twitter: "",
    instagram: "",
    github: "",
    youtube: "",
  });
  
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // FETCH FUNCTIONS
  // ============================================
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/users/profile", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setUserProfile(data.user);
      setCoverImage(data.user?.coverImage || "");
      setIsFollowing(data.isFollowing || false);
      setEditForm({
        name: data.user?.name || "",
        bio: data.user?.bio || "",
        username: data.user?.username || "",
        location: data.user?.location || "",
        website: data.user?.website || "",
        twitter: data.user?.twitter || "",
        instagram: data.user?.instagram || "",
        github: data.user?.github || "",
        youtube: data.user?.youtube || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  }, []);

  const fetchUserPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/posts", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setUserPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && session?.user) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [mounted, session, fetchUserProfile, fetchUserPosts]);

  // ============================================
  // COVER PHOTO UPLOAD
  // ============================================
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB");
      e.target.value = "";
      return;
    }

    setUploadingCover(true);

    const formData = new FormData();
    formData.append("cover", file);

    try {
      const res = await fetch("/api/users/me/cover", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload cover");
      }

      setCoverImage(data.url);
      toast.success("Cover photo updated successfully!");
      await fetchUserProfile();
    } catch (error) {
      console.error("Cover upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload cover photo");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  // ============================================
  // AVATAR UPLOAD
  // ============================================
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 2MB");
      e.target.value = "";
      return;
    }

    setUploadingAvatar(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/users/me/image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setUserProfile((prev: any) => ({ ...prev, image: data.image }));
      toast.success("Profile picture updated successfully!");
      await update();
      await fetchUserProfile();
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload profile picture");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // ============================================
  // TRIGGER UPLOAD FUNCTIONS
  // ============================================
  const triggerCoverUpload = () => {
    if (coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  const triggerAvatarUpload = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.click();
    }
  };

  // ============================================
  // FOLLOW HANDLER
  // ============================================
  const handleFollow = async () => {
    if (!session) {
      toast.error("Please login to follow");
      return;
    }

    try {
      const action = isFollowing ? "unfollow" : "follow";
      const res = await fetch(`/api/users/${userProfile?._id}/follow?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to follow");
      }

      setIsFollowing(!isFollowing);
      toast.success(isFollowing ? "Unfollowed" : "Following");
      await fetchUserProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update follow");
    }
  };

  // ============================================
  // UPDATE PROFILE
  // ============================================
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      await fetchUserProfile();
      await update();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // SHARE PROFILE
  // ============================================
  const handleShareProfile = async () => {
    const url = `${window.location.origin}/profile/${userProfile?.username}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handlePostDeleted = () => {
    fetchUserPosts();
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (!mounted || !session) {
    return <ProfileSkeleton />;
  }

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Profile Header */}
      <Card className="relative overflow-hidden border-0 shadow-lg">
        {/* Cover Photo */}
        <div className="relative h-56 md:h-64 overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          {coverImage && coverImage !== "" && (
            <img 
              src={coverImage} 
              alt="Cover" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute bottom-3 right-3 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm z-10"
            onClick={triggerCoverUpload}
            disabled={uploadingCover}
          >
            {uploadingCover ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Change Cover
              </>
            )}
          </Button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverUpload}
          />
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            {/* Avatar */}
            <div className="relative group">
              <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
                <AvatarImage src={userProfile?.image || session.user?.image || undefined} />
                <AvatarFallback className="text-3xl">
                  {userProfile?.name?.[0]?.toUpperCase() || session.user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                onClick={triggerAvatarUpload}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{userProfile?.name || session.user?.name}</h1>
                {userProfile?.verified && (
                  <Badge variant="default" className="bg-blue-500">Verified ✓</Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {userProfile?.role || "User"}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                @{userProfile?.username || session.user?.username || session.user?.email?.split("@")[0]}
              </p>
              
              {userProfile?.bio && (
                <p className="mt-2 text-sm">{userProfile.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                {userProfile?.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {userProfile.location}
                  </span>
                )}
                {userProfile?.website && (
                  <a
                    href={userProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {userProfile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString("en-US", { 
                    month: "long", 
                    day: "numeric", 
                    year: "numeric" 
                  })}
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-3">
                <div>
                  <span className="font-semibold">{userProfile?.followersCount || 0}</span>
                  <span className="text-sm text-muted-foreground ml-1">Followers</span>
                </div>
                <div>
                  <span className="font-semibold">{userProfile?.followingCount || 0}</span>
                  <span className="text-sm text-muted-foreground ml-1">Following</span>
                </div>
                <div>
                  <span className="font-semibold">{userPosts.length}</span>
                  <span className="text-sm text-muted-foreground ml-1">Posts</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleShareProfile} className="gap-2">
                <Share2 className="h-4 w-4" />
              </Button>
              {session?.user?.id !== userProfile?._id && (
                <Button variant={isFollowing ? "outline" : "default"} size="sm" onClick={handleFollow} className="gap-2">
                  {isFollowing ? (
                    <><UserCheck className="h-4 w-4" /> Following</>
                  ) : (
                    <><UserPlus className="h-4 w-4" /> Follow</>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit className="h-4 w-4" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ProfileTab)}>
        <TabsList className="grid w-full grid-cols-4 bg-muted/50">
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Posts
          </TabsTrigger>
          <TabsTrigger value="replies" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Replies
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Media
          </TabsTrigger>
          <TabsTrigger value="likes" className="flex items-center gap-2">
            <Heart className="h-4 w-4" /> Likes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : userPosts.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <div className="flex flex-col items-center">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <Sparkles className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground max-w-sm">Share your first post with the community!</p>
              <Button onClick={() => router.push("/feed")} className="mt-4">Create Post</Button>
            </div>
          </Card>
        ) : (
          userPosts.map((post: any) => (
            <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
          ))
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} placeholder="username" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Bio</label>
                <Textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} placeholder="Tell us about yourself" rows={3} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Input value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} placeholder="City, Country" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input value={editForm.website} onChange={(e) => setEditForm({ ...editForm, website: e.target.value })} placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Twitter</label>
                <Input value={editForm.twitter} onChange={(e) => setEditForm({ ...editForm, twitter: e.target.value })} placeholder="https://twitter.com/username" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Instagram</label>
                <Input value={editForm.instagram} onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })} placeholder="https://instagram.com/username" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GitHub</label>
                <Input value={editForm.github} onChange={(e) => setEditForm({ ...editForm, github: e.target.value })} placeholder="https://github.com/username" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">YouTube</label>
                <Input value={editForm.youtube} onChange={(e) => setEditForm({ ...editForm, youtube: e.target.value })} placeholder="https://youtube.com/@username" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="bg-muted rounded-lg h-56 md:h-64 animate-pulse" />
      <div className="flex items-center gap-4 -mt-16">
        <div className="h-28 w-28 rounded-full bg-muted animate-pulse ring-4 ring-background" />
        <div className="flex-1 space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="h-10 w-full bg-muted rounded animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}