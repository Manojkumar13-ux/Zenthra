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
  UserCircle
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
    activeIcon: <Home className="h-5 w-5 fill-current" />
  },
  { 
    name: "Explore", 
    href: "/explore", 
    icon: <Compass className="h-5 w-5" />,
    activeIcon: <Compass className="h-5 w-5 fill-current" />
  },
  { 
    name: "Notifications", 
    href: "/notifications", 
    icon: <Bell className="h-5 w-5" />,
    activeIcon: <Bell className="h-5 w-5 fill-current" />,
    badge: 0 
  },
  { 
    name: "Messages", 
    href: "/messages", 
    icon: <Mail className="h-5 w-5" />,
    activeIcon: <Mail className="h-5 w-5 fill-current" />,
    badge: 0 
  },
  { 
    name: "Communities", 
    href: "/communities", 
    icon: <Users className="h-5 w-5" />,
    activeIcon: <Users className="h-5 w-5 fill-current" />
  },
  { 
    name: "Find People", 
    href: "/find-people", 
    icon: <UserSearch className="h-5 w-5" />,
    activeIcon: <UserSearch className="h-5 w-5 fill-current" />
  },
  { 
    name: "Analytics", 
    href: "/analytics", 
    icon: <BarChart3 className="h-5 w-5" />,
    activeIcon: <BarChart3 className="h-5 w-5 fill-current" />
  },
  { 
    name: "Achievements", 
    href: "/achievements", 
    icon: <Trophy className="h-5 w-5" />,
    activeIcon: <Trophy className="h-5 w-5 fill-current" />
  },
  { 
    name: "Scheduled", 
    href: "/scheduled", 
    icon: <Calendar className="h-5 w-5" />,
    activeIcon: <Calendar className="h-5 w-5 fill-current" />
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
        <div className="h-screen w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 p-4">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
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

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Zenthra</h1>
          <p className="text-gray-500 mb-6">Please sign in to continue</p>
          <a href="/login" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Sign In
          </a>
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

      {/* Sidebar - REMOVED Collapse functionality */}
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
        <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
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

          {/* Profile Dropdown Menu */}
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
              {/* ❌ REMOVED: Dark Mode toggle from dropdown */}
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
                  {isActive && item.activeIcon ? item.activeIcon : item.icon}
                </span>
                <span className="text-sm font-medium flex-1">{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions - REMOVED Collapse and Dark Mode */}
        <div className="p-4 border-t dark:border-gray-700 space-y-2 flex-shrink-0">
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
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b dark:border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold lg:hidden">Zenthra</h1>

            {/* Right Actions */}
            <div className="flex items-center gap-2 ml-auto">
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
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </div>

      {/* ✅ Right Sidebar - COMPLETELY REMOVED */}
      {/* No right sidebar here */}

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