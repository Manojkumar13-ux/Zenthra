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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar
        unreadNotifications={unreadNotifications}
        unreadMessages={unreadMessages}
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <div className="flex pt-16">
        <Sidebar
          unreadNotifications={unreadNotifications}
          unreadMessages={unreadMessages}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 min-h-screen px-4 py-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {children}
          </div>
        </main>
        <RightSidebar />
      </div>
    </div>
  );
}