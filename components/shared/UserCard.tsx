// components/shared/UserCard.tsx
"use client";

import Link from "next/link";
import { UserPlus, UserCheck, Mail } from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface User {
  _id: string;
  name: string;
  username: string;
  image?: string | null;
  bio?: string;
  followersCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
  online?: boolean;
  role?: string;
}

interface UserCardProps {
  user: User;
  variant?: "horizontal" | "vertical";
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
  onFollowChange,
  className,
}: UserCardProps) {
  const handleFollow = async () => {
    // Implementation
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 hover:shadow-md transition-shadow",
        variant === "vertical" ? "text-center" : "",
        className
      )}
    >
      <div className={cn(
        "flex items-start gap-3",
        variant === "vertical" ? "flex-col items-center" : ""
      )}>
        <Link href={`/profile/${user._id}`} className="flex-shrink-0">
          <AvatarSimple
            src={user.image}
            fallback={user.name?.[0] || "U"}
            alt={user.name}
            size={variant === "vertical" ? "xl" : "lg"}
            className={variant === "vertical" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg"}
          />
        </Link>
        <div className={cn(
          "flex-1 min-w-0",
          variant === "vertical" ? "text-center" : ""
        )}>
          <div className="flex items-center gap-2 justify-center">
            <Link
              href={`/profile/${user._id}`}
              className="font-semibold hover:text-blue-500 transition-colors truncate"
            >
              {user.name}
            </Link>
            {user.role === "admin" && (
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">@{user.username}</p>
          {user.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
              {user.bio}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 justify-center">
            {user.postsCount !== undefined && (
              <span>{user.postsCount} posts</span>
            )}
            {user.followersCount !== undefined && (
              <span>{user.followersCount} followers</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pt-3 border-t dark:border-gray-800">
        {showFollowButton && (
          <Button
            size="sm"
            variant={user.isFollowing ? "default" : "outline"}
            className={cn(
              "flex-1 gap-1",
              user.isFollowing && "bg-green-500 hover:bg-green-600 text-white"
            )}
            onClick={() => onFollowChange?.(user._id, !user.isFollowing)}
          >
            {user.isFollowing ? (
              <UserCheck className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {user.isFollowing ? "Following" : "Follow"}
          </Button>
        )}
        {showMessageButton && (
          <Link href={`/messages?userId=${user._id}`}>
            <Button variant="outline" size="sm" className="px-3">
              <Mail className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}