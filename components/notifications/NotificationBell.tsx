"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationDropdown } from "./NotificationDropdown";
import { useNotificationStore } from "@/store/notificationStore";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { unreadCount, setUnreadCount } = useNotificationStore();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update unread count
  useEffect(() => {
    if (notifications) {
      const unread = notifications.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    }
  }, [notifications, setUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PUT",
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center bg-red-500 px-1.5 py-0.5 text-[10px] hover:bg-red-600">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 max-h-[500px] w-80 overflow-hidden rounded-lg border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900 sm:w-96">
          <div className="flex items-center justify-between border-b p-3 dark:border-gray-700">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Mark all as read
              </Button>
            )}
          </div>
          <NotificationDropdown notifications={notifications || []} />
        </div>
      )}
    </div>
  );
}
