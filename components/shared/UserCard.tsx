// components/shared/UserCard.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserPlus, UserCheck, MessageCircle, Loader2, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface UserCardProps {
  user: {
    _id: string;
    name: string;
    username: string;
    image?: string;
    bio?: string;
    followers?: any[];
    followersCount?: number;
    postsCount?: number;
    isFollowing?: boolean;
    online?: boolean;
    role?: string;
  };
  variant?: "horizontal" | "vertical" | "compact";
  showFollowButton?: boolean;
  showMessageButton?: boolean;
  showUnfollowButton?: boolean;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
  className?: string;
}

export default function UserCard({
  user,
  variant = "horizontal",
  showFollowButton = true,
  showMessageButton = true,
  showUnfollowButton = true,
  onFollowChange,
  className,
}: UserCardProps) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const isOwnProfile = session?.user?.id === user._id;

  // ============================================
  // FOLLOW HANDLER
  // ============================================
  const handleFollow = async () => {
    if (!session) {
      toast.error("Please login to follow users");
      return;
    }

    if (isOwnProfile) {
      toast.error("You cannot follow yourself");
      return;
    }

    // Validate user ID
    if (!/^[0-9a-fA-F]{24}$/.test(user._id)) {
      toast.error("Invalid user ID");
      console.error("Invalid user ID:", user._id);
      return;
    }

    setIsLoading(true);
    try {
      const action = isFollowing ? "unfollow" : "follow";
      const res = await fetch(`/api/users/${user._id}/follow?action=${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to follow/unfollow");
      }

      setIsFollowing(data.isFollowing);

      // Update session to refresh user data
      await update();

      if (onFollowChange) {
        onFollowChange(user._id, data.isFollowing);
      }

      toast.success(
        data.message || (data.isFollowing ? `Following ${user.name}` : `Unfollowed ${user.name}`)
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // UNFOLLOW HANDLER (Separate button)
  // ============================================
  const handleUnfollow = async () => {
    if (!session) {
      toast.error("Please login to unfollow");
      return;
    }

    if (isOwnProfile) {
      toast.error("You cannot unfollow yourself");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${user._id}/follow?action=unfollow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to unfollow");
      }

      setIsFollowing(false);

      await update();

      if (onFollowChange) {
        onFollowChange(user._id, false);
      }

      toast.success(data.message || `Unfollowed ${user.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unfollow user");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // MESSAGE HANDLER
  // ============================================
  const handleMessage = () => {
    if (!session) {
      toast.error("Please login to send messages");
      return;
    }
    router.push(`/messages?user=${user._id}`);
  };

  // ============================================
  // Compact Variant
  // ============================================
  if (variant === "compact") {
    return (
      <Card className={cn("p-3 transition-shadow hover:shadow-md", className)}>
        <div className="flex items-center gap-3">
          <Link href={`/profile/${user._id}`}>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image} />
              <AvatarFallback className="text-xs">
                {user.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/profile/${user._id}`} className="hover:underline">
              <p className="truncate text-sm font-medium">{user.name}</p>
            </Link>
            <p className="truncate text-xs text-gray-500">@{user.username}</p>
          </div>
          {!isOwnProfile && showFollowButton && (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              disabled={isLoading}
              className="h-7 px-3 text-xs"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isFollowing ? (
                <UserCheck className="h-3 w-3" />
              ) : (
                "Follow"
              )}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // ============================================
  // Vertical Variant
  // ============================================
  if (variant === "vertical") {
    return (
      <Card className={cn("p-6 transition-shadow hover:shadow-md", className)}>
        <div className="flex flex-col items-center text-center">
          <Link href={`/profile/${user._id}`}>
            <Avatar className="mb-3 h-20 w-20">
              <AvatarImage src={user.image} />
              <AvatarFallback className="text-2xl">
                {user.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/profile/${user._id}`} className="hover:underline">
            <h4 className="text-lg font-semibold">{user.name}</h4>
          </Link>
          <p className="text-sm text-gray-500">@{user.username}</p>

          {user.bio && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{user.bio}</p>
          )}

          {user.online && (
            <Badge variant="outline" className="mt-2 border-green-500 text-green-500">
              Online
            </Badge>
          )}

          <div className="mt-3 flex gap-4 text-sm">
            <div>
              <span className="font-semibold">{user.followersCount || 0}</span>
              <span className="ml-1 text-gray-500">Followers</span>
            </div>
            <div>
              <span className="font-semibold">{user.postsCount || 0}</span>
              <span className="ml-1 text-gray-500">Posts</span>
            </div>
          </div>

          <div className="mt-3 flex w-full gap-2">
            {!isOwnProfile && (
              <>
                {showFollowButton && !isFollowing && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleFollow}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Follow"}
                  </Button>
                )}
                {showUnfollowButton && isFollowing && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleUnfollow}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserX className="mr-1 h-4 w-4" />
                        Unfollow
                      </>
                    )}
                  </Button>
                )}
                {showMessageButton && (
                  <Button variant="outline" size="sm" onClick={handleMessage} className="flex-1">
                    <MessageCircle className="mr-1 h-4 w-4" />
                    Message
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // ============================================
  // Horizontal Variant (Default)
  // ============================================
  return (
    <Card className={cn("p-4 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-center gap-4">
        <Link href={`/profile/${user._id}`}>
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.image} />
            <AvatarFallback className="text-lg">
              {user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${user._id}`} className="hover:underline">
              <p className="truncate text-sm font-semibold">{user.name}</p>
            </Link>
            {user.role === "admin" && (
              <Badge variant="default" className="px-1.5 py-0 text-[10px]">
                Admin
              </Badge>
            )}
            {user.online && <div className="h-2 w-2 rounded-full bg-green-500" />}
          </div>

          <p className="truncate text-sm text-gray-500">@{user.username}</p>

          {user.bio && (
            <p className="mt-0.5 line-clamp-1 text-sm text-gray-600 dark:text-gray-400">
              {user.bio}
            </p>
          )}

          <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-400">
            <span>{user.followersCount || 0} followers</span>
            <span>{user.postsCount || 0} posts</span>
          </div>
        </div>

        {!isOwnProfile && (
          <div className="flex gap-2">
            {showFollowButton && !isFollowing && (
              <Button
                variant="default"
                size="sm"
                onClick={handleFollow}
                disabled={isLoading}
                className="h-8 px-3"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="mr-1 h-4 w-4" />
                    Follow
                  </>
                )}
              </Button>
            )}

            {showUnfollowButton && isFollowing && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnfollow}
                disabled={isLoading}
                className="h-8 px-3"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <UserX className="mr-1 h-4 w-4" />
                    Unfollow
                  </>
                )}
              </Button>
            )}

            {showMessageButton && (
              <Button variant="ghost" size="icon" onClick={handleMessage} className="h-8 w-8">
                <MessageCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
