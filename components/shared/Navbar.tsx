// components/shared/navbar.tsx (updated - removed trending and emoji sections)
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Home,
  Compass,
  Bell,
  Mail,
  Users,
  UserSearch,
  BarChart3,
  Trophy,
  Calendar,
  LogOut,
  Settings,
  Search,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  Bookmark,
  UserCircle,
  Heart,
  MessageCircle,
  Repeat,
  Loader2,
  Tv,
  Music,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Film,
  Database,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  sender?: {
    name: string;
    username: string;
    image: string;
  };
  post?: {
    _id: string;
  };
}

const navItems: NavItem[] = [
  { name: "Home", href: "/feed", icon: <Home className="h-5 w-5" /> },
  { name: "Explore", href: "/explore", icon: <Compass className="h-5 w-5" /> },
  { name: "Notifications", href: "/notifications", icon: <Bell className="h-5 w-5" />, badge: 0 },
  { name: "Messages", href: "/messages", icon: <Mail className="h-5 w-5" />, badge: 0 },
  { name: "Communities", href: "/communities", icon: <Users className="h-5 w-5" /> },
  { name: "Find People", href: "/find-people", icon: <UserSearch className="h-5 w-5" /> },
  { name: "Analytics", href: "/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { name: "Achievements", href: "/achievements", icon: <Trophy className="h-5 w-5" /> },
  { name: "Scheduled", href: "/scheduled", icon: <Calendar className="h-5 w-5" /> },
  { name: "Profile", href: "/profile", icon: <UserCircle className="h-5 w-5" /> },
  { name: "Settings", href: "/settings", icon: <Settings className="h-5 w-5" /> },
];

interface NavbarProps {
  children?: React.ReactNode;
}

export function Navbar({ children }: NavbarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session && mounted) {
      fetchNotifications();
      fetchUnreadMessages();
    }
  }, [session, mounted]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsProfileMenuOpen(false);
  }, [pathname]);

  const fetchNotifications = async () => {
    try {
      setIsNotificationsLoading(true);
      const res = await fetch("/api/notifications?limit=5");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        const unread = data.notifications?.filter((n: any) => !n.read).length || 0;
        setUnreadCount(unread);

        const notifIndex = navItems.findIndex((item) => item.name === "Notifications");
        if (notifIndex !== -1) {
          navItems[notifIndex].badge = unread;
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const fetchUnreadMessages = async () => {
    try {
      const res = await fetch("/api/messages/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadMessages(data.count || 0);

        const msgIndex = navItems.findIndex((item) => item.name === "Messages");
        if (msgIndex !== -1) {
          navItems[msgIndex].badge = data.count || 0;
        }
      }
    } catch (error) {
      console.error("Failed to fetch unread messages:", error);
      setUnreadMessages(0);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-3 w-3 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-3 w-3 text-blue-500" />;
      case "follow":
        return <UserCircle className="h-3 w-3 text-green-500" />;
      case "repost":
        return <Repeat className="h-3 w-3 text-purple-500" />;
      default:
        return <Bell className="h-3 w-3 text-gray-500" />;
    }
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  };

  const goToProfile = () => {
    if (session?.user?.id) {
      router.push(`/profile/${session.user.id}`);
    }
    setIsProfileMenuOpen(false);
  };

  const redirectToMessages = () => {
    router.push("/messages");
  };

  const redirectToNotifications = () => {
    router.push("/notifications");
    setIsNotificationsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-64 border-r p-4 dark:border-gray-700">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="h-10 rounded bg-gray-200 dark:bg-gray-700"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse">
            <div className="mb-4 h-12 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded bg-gray-200 dark:bg-gray-700"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Welcome to Zenthra</h1>
          <p className="mb-6 text-gray-500">Please sign in to continue</p>
          <Link
            href="/login"
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 lg:hidden"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Left Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-40 flex h-screen w-64 flex-col border-r bg-white shadow-lg transition-transform duration-300 dark:border-gray-700 dark:bg-gray-800 lg:sticky lg:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex-shrink-0 border-b p-4 dark:border-gray-700">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-2xl font-bold text-blue-500 transition-colors hover:text-blue-600"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Sparkles className="h-6 w-6" />
            <span>Zenthra</span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="relative flex-shrink-0 border-b p-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={goToProfile}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              <AvatarSimple
                src={session?.user?.image}
                fallback={session?.user?.name || "User"}
                alt={session?.user?.name || "User"}
                size="md"
              />
            </button>
            <div className="min-w-0 flex-1">
              <button
                onClick={goToProfile}
                className="cursor-pointer truncate text-left text-sm font-semibold transition-colors hover:text-blue-500"
              >
                {session?.user?.name}
              </button>
              <p className="truncate text-xs text-gray-500">@{session?.user?.username || "user"}</p>
            </div>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div
              ref={profileMenuRef}
              className="absolute left-4 right-4 z-50 mt-2 rounded-lg border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  goToProfile();
                }}
                className="flex w-full items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <UserCircle className="h-4 w-4" />
                <span className="text-sm">Profile</span>
              </button>

              <Link
                href="/bookmarks"
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Bookmark className="h-4 w-4" />
                <span className="text-sm">Bookmarks</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Settings</span>
              </Link>
              <div className="my-1 border-t dark:border-gray-700"></div>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-2 text-red-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-500 dark:bg-blue-900/20"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span
                  className={cn(
                    "flex-shrink-0 transition-transform group-hover:scale-110",
                    isActive && "text-blue-500"
                  )}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="min-w-[20px] animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-center text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="flex-shrink-0 space-y-2 border-t p-4 dark:border-gray-700">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-h-screen w-full flex-1 flex-col overflow-hidden">
        {/* Top Bar - NO Create Button, Only Icons */}
        <header className="sticky top-0 z-30 flex-shrink-0 border-b bg-white/80 px-4 py-2 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            {/* Search Bar */}
            <div className="max-w-md flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search Zenthra..."
                  className="w-full rounded-full border-0 bg-gray-100 py-1.5 pl-9 pr-4 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchQuery("");
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Icons - Dark Mode, Notifications, Messages, Profile */}
            <div className="ml-4 flex items-center gap-1">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>

              {/* Notifications Icon - Redirects to /notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={redirectToNotifications}
                  className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Messages Icon - Redirects to /messages */}
              <button
                onClick={redirectToMessages}
                className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Messages"
              >
                <Mail className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </button>

              {/* Profile Icon - Redirects to Profile */}
              <button
                onClick={goToProfile}
                className="rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Profile"
              >
                <AvatarSimple
                  src={session?.user?.image}
                  fallback={session?.user?.name?.[0] || "U"}
                  alt={session?.user?.name || "User"}
                  size="sm"
                />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
