"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Repeat2,
  AtSign,
  Bell as BellIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface Notification {
  _id: string;
  type: "like" | "comment" | "follow" | "repost" | "mention" | "message";
  from: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  targetId?: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose?: () => void;
}

const notificationIcons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  repost: Repeat2,
  mention: AtSign,
  message: BellIcon,
};

const notificationColors = {
  like: "text-red-500",
  comment: "text-blue-500",
  follow: "text-green-500",
  repost: "text-purple-500",
  mention: "text-yellow-500",
  message: "text-indigo-500",
};

export function NotificationDropdown({ notifications, onClose }: NotificationDropdownProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleNotificationClick = async (notification: Notification) => {
    setLoadingId(notification._id);

    try {
      // Mark as read
      if (!notification.read) {
        await fetch(`/api/notifications/${notification._id}/read`, {
          method: "PUT",
        });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }

      // Navigate based on notification type
      if (notification.type === "follow") {
        router.push(`/profile/${notification.from._id}`);
      } else if (notification.targetId) {
        router.push(`/feed?postId=${notification.targetId}`);
      }

      if (onClose) onClose();
    } catch (error) {
      console.error("Error handling notification:", error);
      toast.error("Failed to open notification");
    } finally {
      setLoadingId(null);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <BellIcon className="mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          When you get notifications, they'll appear here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="divide-y dark:divide-gray-700">
        {notifications.map((notification) => {
          const Icon = notificationIcons[notification.type] || BellIcon;
          const color = notificationColors[notification.type] || "text-gray-500";
          const isUnread = !notification.read;
          const isLoading = loadingId === notification._id;

          return (
            <div
              key={notification._id}
              className={cn(
                "flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800",
                isUnread && "bg-indigo-50 dark:bg-indigo-900/20"
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={notification.from.image} />
                <AvatarFallback>{notification.from.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <div className={cn("mt-0.5", color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold hover:underline">
                        {notification.from.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {" "}
                        {notification.message}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-gray-400" />
              ) : isUnread ? (
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
              ) : null}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
