// components/shared/LeftSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  UserCircle,
  Bookmark,
  ChevronDown,
  X,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeftSidebarProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
  { name: "Home", href: "/feed", icon: Home },
  { name: "Explore", href: "/explore", icon: Compass },
  { name: "Notifications", href: "/notifications", icon: Bell, badge: "notifications" },
  { name: "Messages", href: "/messages", icon: Mail, badge: "messages" },
  { name: "Communities", href: "/communities", icon: Users },
  { name: "Find People", href: "/find-people", icon: UserSearch },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Achievements", href: "/achievements", icon: Trophy },
  { name: "Scheduled", href: "/scheduled", icon: Calendar },
  { name: "Profile", href: "/profile", icon: UserCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

const categories = ["Movies", "Sports", "Technology", "Music", "Gaming", "Business", "Education"];

export function Sidebar({
  unreadNotifications = 0,
  unreadMessages = 0,
  isMobileOpen = false,
  onCloseMobile,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const goToProfile = () => {
    if (session?.user?.id) {
      window.location.href = `/profile/${session.user.id}`;
    }
  };

  const getBadgeCount = (item: typeof navItems[0]) => {
    if (item.badge === "notifications") return unreadNotifications;
    if (item.badge === "messages") return unreadMessages;
    return 0;
  };

  const SidebarContent = () => (
    <>
      {/* User Profile */}
      <div className="p-4 border-b dark:border-gray-800">
        <div className="flex items-center gap-3">
          <button onClick={goToProfile} className="cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarSimple
              src={session?.user?.image}
              fallback={session?.user?.name?.[0] || "U"}
              alt={session?.user?.name || "User"}
              size="md"
            />
          </button>
          <div className="flex-1 min-w-0">
            <button onClick={goToProfile} className="font-semibold text-sm truncate hover:text-blue-500 transition-colors cursor-pointer text-left">
              {session?.user?.name}
            </button>
            <p className="text-xs text-gray-500 truncate">@{session?.user?.username || "user"}</p>
          </div>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div className="mt-2 rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 py-1">
            <button
              onClick={() => { setIsProfileOpen(false); goToProfile(); }}
              className="flex w-full items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              <span className="text-sm">Profile</span>
            </button>
            <Link
              href="/bookmarks"
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsProfileOpen(false)}
            >
              <Bookmark className="h-4 w-4" />
              <span className="text-sm">Bookmarks</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsProfileOpen(false)}
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </Link>
            <div className="my-1 border-t dark:border-gray-700"></div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const badgeCount = getBadgeCount(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              {badgeCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-[20px] rounded-full px-1 text-xs">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Categories */}
      <div className="p-4 border-t dark:border-gray-800">
        <p className="text-xs font-medium text-gray-500 uppercase mb-2">Categories</p>
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <Badge key={category} variant="outline" className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r dark:border-gray-800 lg:bg-white dark:bg-gray-900 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} />
          <aside className="fixed left-0 top-0 z-50 h-full w-72 bg-white dark:bg-gray-900 shadow-xl lg:hidden overflow-y-auto">
            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
              <span className="text-xl font-bold text-blue-500">Zenthra</span>
              <button onClick={onCloseMobile} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}