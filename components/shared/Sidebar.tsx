// components/shared/Sidebar.tsx
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
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  Bookmark,
  UserCircle,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  activeIcon?: React.ReactNode;
}

interface SidebarProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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

export function Sidebar({ 
  unreadNotifications = 0, 
  unreadMessages = 0,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (!confirmed) return;
      
      toast.loading("Signing out...");
      await signOut({ 
        callbackUrl: "/login",
        redirect: true 
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    }
  };

  const goToProfile = () => {
    if (session?.user?.id) {
      router.push(`/profile/${session.user.id}`);
    }
  };

  if (!mounted) {
    return (
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="animate-pulse p-4">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <div className="animate-pulse p-4">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 lg:hidden"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 z-40 flex h-screen w-64 flex-col border-r bg-white shadow-lg transition-transform duration-300 dark:border-gray-800 dark:bg-gray-900 lg:shadow-none flex-shrink-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex-shrink-0 border-b p-4 dark:border-gray-800">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-2xl font-bold text-blue-500 transition-colors hover:text-blue-600"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Sparkles className="h-6 w-6" />
            <span>Zenthra</span>
          </Link>
        </div>

        <div className="relative flex-shrink-0 border-b p-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={goToProfile}
              className="cursor-pointer transition-opacity hover:opacity-80"
            >
              <AvatarSimple
                src={session?.user?.image}
                fallback={session?.user?.name?.[0] || "U"}
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
              className="rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>

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
                className="flex w-full items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <UserCircle className="h-4 w-4" />
                <span className="text-sm">Profile</span>
              </button>
              <Link
                href="/bookmarks"
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Bookmark className="h-4 w-4" />
                <span className="text-sm">Bookmarks</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Settings</span>
              </Link>
              <div className="my-1 border-t dark:border-gray-700"></div>
              <button
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setIsProfileMenuOpen(false);
                }}
                className="flex w-full items-center gap-3 px-4 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="text-sm">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            let badgeCount = 0;
            if (item.name === "Notifications") badgeCount = unreadNotifications;
            if (item.name === "Messages") badgeCount = unreadMessages;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                  isActive
                    ? "bg-blue-50 text-blue-500 dark:bg-blue-900/20"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
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
                {badgeCount > 0 && (
                  <span className="min-w-[20px] rounded-full bg-red-500 px-2 py-0.5 text-center text-xs text-white">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 space-y-2 border-t p-4 dark:border-gray-800">
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

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}