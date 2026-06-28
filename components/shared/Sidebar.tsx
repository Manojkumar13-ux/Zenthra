// components/shared/Sidebar.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Compass, Bell, Mail, Users, UserPlus, BarChart3, 
  Award, Calendar, Bookmark, Settings, LogOut 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button"; // ← ADD THIS IMPORT
import { useState, useEffect } from "react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: number;
}

export default function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems: NavItem[] = [
    { icon: <Home className="h-5 w-5" />, label: "Home", href: "/feed" },
    { icon: <Compass className="h-5 w-5" />, label: "Explore", href: "/explore" },
    { icon: <Bell className="h-5 w-5" />, label: "Notifications", href: "/notifications", badge: 3 },
    { icon: <Mail className="h-5 w-5" />, label: "Messages", href: "/messages", badge: 5 },
    { icon: <Users className="h-5 w-5" />, label: "Communities", href: "/communities" },
    { icon: <UserPlus className="h-5 w-5" />, label: "Find People", href: "/find-people" },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Analytics", href: "/analytics" },
    { icon: <Award className="h-5 w-5" />, label: "Achievements", href: "/achievements" },
    { icon: <Calendar className="h-5 w-5" />, label: "Scheduled", href: "/scheduled" },
    { icon: <Bookmark className="h-5 w-5" />, label: "Bookmarks", href: "/bookmarks" },
  ];

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-4 h-[600px] animate-pulse">
        <div className="space-y-2">
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Show empty sidebar when not authenticated
  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-4">
        <div className="mb-6 pb-6 border-b dark:border-gray-700">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Zenthra
            </span>
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Sign in to access</p>
          <Link href="/login">
            <Button className="mt-4 w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="mb-6 pb-6 border-b dark:border-gray-700">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Zenthra
          </span>
        </Link>
      </div>

      {session?.user && (
        <div className="mb-6 pb-6 border-b dark:border-gray-700">
          <Link href="/profile" className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors">
            <Avatar className="h-12 w-12">
              <AvatarImage src={session.user?.image || undefined} />
              <AvatarFallback>{session.user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{session.user?.name}</p>
              <p className="text-xs text-gray-500 truncate">@{session.user?.username || session.user?.email?.split("@")[0]}</p>
            </div>
          </Link>
        </div>
      )}

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 pt-6 border-t dark:border-gray-700 space-y-2">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span>Settings</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm w-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}