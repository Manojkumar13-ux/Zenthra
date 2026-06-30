// components/shared/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Bell,
  Mail,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";

interface NavbarProps {
  unreadNotifications?: number;
  unreadMessages?: number;
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({
  unreadNotifications = 0,
  unreadMessages = 0,
  onMenuToggle,
  isMobileMenuOpen = false,
}: NavbarProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  // ✅ Prevent hydration mismatch by rendering only after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const goToNotifications = () => router.push("/notifications");
  const goToMessages = () => router.push("/messages");
  const goToProfile = () => {
    if (session?.user?.id) {
      router.push(`/profile/${session.user.id}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b dark:border-gray-800">
      <div className="flex items-center justify-between px-4 h-16 lg:px-6">
        {/* Left: Logo + Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link href="/feed" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-blue-500">Zenthra</span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search Zenthra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-1"
          />
        </form>

        {/* Right: Icons */}
        <div className="flex items-center gap-1">
          {/* Dark Mode Toggle - only render after mount */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-500" />
              ) : (
                <Moon className="h-5 w-5 text-gray-600" />
              )}
            </button>
          )}

          {/* Notifications */}
          <button
            onClick={goToNotifications}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] rounded-full px-1 text-xs bg-red-500 hover:bg-red-600">
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </Badge>
            )}
          </button>

          {/* Messages */}
          <button
            onClick={goToMessages}
            className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Messages"
          >
            <Mail className="h-5 w-5" />
            {unreadMessages > 0 && (
              <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] rounded-full px-1 text-xs bg-red-500 hover:bg-red-600">
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </Badge>
            )}
          </button>

          {/* Profile */}
          <button
            onClick={goToProfile}
            className="ml-1 hover:opacity-80 transition-opacity"
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

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search Zenthra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full bg-gray-100 dark:bg-gray-800 border-0 focus-visible:ring-1"
          />
        </form>
      </div>
    </header>
  );
}