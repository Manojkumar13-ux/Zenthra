// app/(main)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/shared/Navbar";
import { Sidebar } from "@/components/shared/Sidebar";
import { RightSidebar } from "@/components/shared/RightSidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (session) {
      fetchUnreadCounts();
    }
  }, [session]);

  const fetchUnreadCounts = async () => {
    try {
      const [notifRes, msgRes] = await Promise.all([
        fetch("/api/notifications/unread-count"),
        fetch("/api/messages/unread-count"),
      ]);
      if (notifRes.ok) {
        const data = await notifRes.json();
        setUnreadNotifications(data.count || 0);
      }
      if (msgRes.ok) {
        const data = await msgRes.json();
        setUnreadMessages(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread counts:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex">
        <Sidebar
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-h-[calc(100vh-4rem)] max-w-3xl mx-auto p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}