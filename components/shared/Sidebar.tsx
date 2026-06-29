// components/shared/sidebar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  User,
  PlusCircle,
  Search,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  TrendingUp,
  MessageCircle,
  Heart,
  Bookmark,
  Flag,
  UserCircle,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  activeIcon?: React.ReactNode;
}

interface SidebarProps {
  children?: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    name: "Home",
    href: "/feed",
    icon: <Home className="h-5 w-5" />,
    activeIcon: <Home className="h-5 w-5 fill-current" />,
  },
  {
    name: "Explore",
    href: "/explore",
    icon: <Compass className="h-5 w-5" />,
    activeIcon: <Compass className="h-5 w-5 fill-current" />,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: <Bell className="h-5 w-5" />,
    activeIcon: <Bell className="h-5 w-5 fill-current" />,
    badge: 0,
  },
  {
    name: "Messages",
    href: "/messages",
    icon: <Mail className="h-5 w-5" />,
    activeIcon: <Mail className="h-5 w-5 fill-current" />,
    badge: 0,
  },
  {
    name: "Communities",
    href: "/communities",
    icon: <Users className="h-5 w-5" />,
    activeIcon: <Users className="h-5 w-5 fill-current" />,
  },
  {
    name: "Find People",
    href: "/find-people",
    icon: <UserSearch className="h-5 w-5" />,
    activeIcon: <UserSearch className="h-5 w-5 fill-current" />,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    activeIcon: <BarChart3 className="h-5 w-5 fill-current" />,
  },
  {
    name: "Achievements",
    href: "/achievements",
    icon: <Trophy className="h-5 w-5" />,
    activeIcon: <Trophy className="h-5 w-5 fill-current" />,
  },
  {
    name: "Scheduled",
    href: "/scheduled",
    icon: <Calendar className="h-5 w-5" />,
    activeIcon: <Calendar className="h-5 w-5 fill-current" />,
  },
];

export function Sidebar({ children }: SidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMobileMenuOpen(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Navigate to profile
  const goToProfile = () => {
    if (session?.user?.id) {
      router.push(`/profile/${session.user.id}`);
    }
  };

  // Don't render on server
  if (!mounted) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="h-screen w-64 border-r bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
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

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Welcome to Zenthra</h1>
          <p className="mb-6 text-gray-500">Please sign in to continue</p>
          <a
            href="/login"
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Sign In
          </a>
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

      {/* Sidebar - REMOVED Collapse functionality */}
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
        <div className="flex-shrink-0 border-b p-4 dark:border-gray-700">
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

          {/* Profile Dropdown Menu */}
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
              {/* ❌ REMOVED: Dark Mode toggle from dropdown */}
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
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                </span>
                <span className="flex-1 text-sm font-medium">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="min-w-[20px] rounded-full bg-red-500 px-2 py-0.5 text-center text-xs text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions - REMOVED Collapse and Dark Mode */}
        <div className="flex-shrink-0 space-y-2 border-t p-4 dark:border-gray-700">
          {/* ✅ PROFILE BUTTON - Added to bottom */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            size="sm"
            onClick={goToProfile}
          >
            <UserCircle className="h-4 w-4" />
            Profile
          </Button>

          <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start gap-3" size="sm">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>

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
      <div className="flex min-h-screen w-full flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex-shrink-0 border-b bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/80">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <h1 className="text-xl font-semibold lg:hidden">Zenthra</h1>

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-2">
              <Link href="/create-post">
                <Button size="sm" className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>

      {/* ✅ Right Sidebar - COMPLETELY REMOVED */}
      {/* No right sidebar here */}

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
