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
        
        const notifIndex = navItems.findIndex(item => item.name === "Notifications");
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
        
        const msgIndex = navItems.findIndex(item => item.name === "Messages");
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
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
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
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
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
        <div className="w-64 border-r dark:border-gray-700 p-4">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Zenthra</h1>
          <p className="text-gray-500 mb-6">Please sign in to continue</p>
          <Link href="/login" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Left Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 h-screen w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col transition-transform duration-300 z-40 shadow-lg lg:shadow-none",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
          <Link 
            href="/feed" 
            className="text-2xl font-bold text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Sparkles className="h-6 w-6" />
            <span>Zenthra</span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b dark:border-gray-700 flex-shrink-0 relative">
          <div className="flex items-center gap-3">
            <button onClick={goToProfile} className="cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarSimple
                src={session?.user?.image}
                fallback={session?.user?.name || "User"}
                alt={session?.user?.name || "User"}
                size="md"
              />
            </button>
            <div className="flex-1 min-w-0">
              <button 
                onClick={goToProfile}
                className="font-semibold text-sm truncate hover:text-blue-500 transition-colors cursor-pointer text-left"
              >
                {session?.user?.name}
              </button>
              <p className="text-xs text-gray-500 truncate">@{session?.user?.username || "user"}</p>
            </div>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Profile Dropdown */}
          {isProfileMenuOpen && (
            <div 
              ref={profileMenuRef}
              className="absolute left-4 right-4 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-50"
            >
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  goToProfile();
                }}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full"
              >
                <UserCircle className="h-4 w-4" />
                <span className="text-sm">Profile</span>
              </button>
              
              <Link 
                href="/bookmarks"
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Bookmark className="h-4 w-4" />
                <span className="text-sm">Bookmarks</span>
              </Link>
              <Link 
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Settings</span>
              </Link>
              <div className="border-t dark:border-gray-700 my-1"></div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-full text-red-500"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  isActive 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500" 
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className={cn(
                  "transition-transform group-hover:scale-110 flex-shrink-0",
                  isActive && "text-blue-500"
                )}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium flex-1">{item.name}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t dark:border-gray-700 space-y-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" 
            size="sm"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
        {/* Top Bar - NO Create Button, Only Icons */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b dark:border-gray-700 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            {/* Search Bar */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search Zenthra..."
                  className="w-full pl-9 pr-4 py-1.5 text-sm rounded-full bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500"
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
            <div className="flex items-center gap-1 ml-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
                  className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Messages Icon - Redirects to /messages */}
              <button
                onClick={redirectToMessages}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Messages"
              >
                <Mail className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {unreadMessages > 9 ? "9+" : unreadMessages}
                  </span>
                )}
              </button>

              {/* Profile Icon - Redirects to Profile */}
              <button
                onClick={goToProfile}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}