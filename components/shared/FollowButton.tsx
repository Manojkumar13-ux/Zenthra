"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing?: boolean;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "outline" | "ghost";
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  initialIsFollowing = false,
  size = "default",
  variant = "default",
  onFollowChange,
}: FollowButtonProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleFollowToggle = async () => {
    if (!session) {
      toast.error("Please login to follow users");
      return;
    }

    if (!userId) {
      toast.error("Invalid user");
      return;
    }

    const action = isFollowing ? "unfollow" : "follow";
    setIsLoading(true);

    try {
      console.log(`🔵 FollowButton: Sending ${action} request for user ${userId}`);
      
      // Use query parameter for action
      const response = await fetch(`/api/users/${userId}/follow?action=${action}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      let data;
      const responseText = await response.text();
      
      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || `Failed to ${action}`);
      }

      setIsFollowing(data.isFollowing);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["find-people"] });
      
      if (onFollowChange) {
        onFollowChange(data.isFollowing);
      }
      
      toast.success(data.isFollowing ? "Followed!" : "Unfollowed!");
    } catch (error: any) {
      console.error("❌ FollowButton error:", error);
      toast.error(error.message || "Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollowToggle}
      disabled={isLoading}
      variant={isFollowing ? "outline" : variant}
      size={size}
      className="gap-1 min-w-[100px]"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {isFollowing ? "Unfollowing..." : "Following..."}
        </>
      ) : isFollowing ? (
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
  );
}