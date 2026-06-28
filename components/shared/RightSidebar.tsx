// components/shared/RightSidebar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Hash,
  TrendingUp,
  Plus,
  Smile,
  ChevronDown,
  Film,
  Trophy,
  Database,
  Music,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Tv,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TrendingHashtag {
  id: string;
  tag: string;
  count: number;
  isActive?: boolean;
}

const emojis = [
  { icon: "😊", label: "Smile" },
  { icon: "😂", label: "Laugh" },
  { icon: "❤️", label: "Love" },
  { icon: "👍", label: "Like" },
  { icon: "👎", label: "Dislike" },
  { icon: "😡", label: "Angry" },
  { icon: "😐", label: "Meh" },
  { icon: "😢", label: "Sad" },
  { icon: "☕", label: "Coffee" },
  { icon: "🍕", label: "Pizza" },
  { icon: "🚀", label: "Rocket" },
  { icon: "👑", label: "Crown" },
  { icon: "🎁", label: "Gift" },
  { icon: "🐛", label: "Bug" },
  { icon: "💡", label: "Idea" },
  { icon: "🔥", label: "Fire" },
  { icon: "🎉", label: "Party" },
  { icon: "✨", label: "Sparkle" },
  { icon: "⭐", label: "Star" },
  { icon: "⚡", label: "Zap" },
];

const categories = [
  { name: "Movies", icon: Film, href: "/explore?category=movies" },
  { name: "Sports", icon: Trophy, href: "/explore?category=sports" },
  { name: "Technology", icon: Database, href: "/explore?category=technology" },
  { name: "Music", icon: Music, href: "/explore?category=music" },
  { name: "Gaming", icon: Gamepad2, href: "/explore?category=gaming" },
  { name: "Business", icon: Briefcase, href: "/explore?category=business" },
  { name: "Education", icon: GraduationCap, href: "/explore?category=education" },
];

export function RightSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("😊");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [newHashtag, setNewHashtag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchTrendingHashtags();
    
    // Set up event listener for new posts with hashtags
    const handleNewPost = (event: CustomEvent) => {
      const { hashtags } = event.detail;
      if (hashtags && hashtags.length > 0) {
        updateTrendingHashtags(hashtags);
      }
    };

    window.addEventListener('newPost' as any, handleNewPost);
    return () => {
      window.removeEventListener('newPost' as any, handleNewPost);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/hashtags/trending");
      if (res.ok) {
        const data = await res.json();
        if (data.hashtags && data.hashtags.length > 0) {
          setTrendingHashtags(data.hashtags);
        }
      }
    } catch (error) {
      console.error("Failed to fetch trending hashtags:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTrendingHashtags = (hashtags: string[]) => {
    setTrendingHashtags(prev => {
      const updated = [...prev];
      
      hashtags.forEach(tag => {
        const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
        const existing = updated.find(h => h.tag.toLowerCase() === cleanTag.toLowerCase());
        
        if (existing) {
          existing.count += 1;
        } else {
          updated.push({
            id: Date.now().toString() + Math.random(),
            tag: cleanTag,
            count: 1,
          });
        }
      });
      
      return updated.sort((a, b) => b.count - a.count);
    });
  };

  const handleAddHashtag = async () => {
    if (!newHashtag.trim()) {
      toast.error("Please enter a hashtag");
      return;
    }
    
    const cleanTag = newHashtag.trim().startsWith('#') ? newHashtag.trim().slice(1) : newHashtag.trim();
    
    try {
      const res = await fetch("/api/hashtags/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: cleanTag }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setTrendingHashtags(prev => {
          const existing = prev.find(h => h.tag.toLowerCase() === cleanTag.toLowerCase());
          if (existing) {
            existing.count += 1;
            return [...prev].sort((a, b) => b.count - a.count);
          }
          const newHashtag = {
            id: data.hashtag?.id || Date.now().toString(),
            tag: cleanTag,
            count: 1,
            isActive: true,
          };
          return [newHashtag, ...prev].sort((a, b) => b.count - a.count);
        });
        setNewHashtag("");
        toast.success(`#${cleanTag} added to trending!`);
      }
    } catch (error) {
      console.error("Failed to add hashtag:", error);
      toast.error("Failed to add hashtag");
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setIsEmojiPickerOpen(false);
    toast.success(`Selected ${emoji}`);
  };

  if (!mounted) {
    return (
      <div className="hidden lg:block w-80 flex-shrink-0 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:block w-80 flex-shrink-0 p-4 space-y-4">
      {/* Trending Hashtags Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold text-lg">Trending Hashtags</h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {trendingHashtags.length === 0 ? (
              <div className="text-center py-4">
                <Hash className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">No trending hashtags yet</p>
                <p className="text-xs text-gray-400 mt-1">Start using #hashtags in your posts!</p>
              </div>
            ) : (
              trendingHashtags.slice(0, 10).map((hashtag, index) => (
                <Link
                  key={hashtag.id}
                  href={`/explore?q=${hashtag.tag}`}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg transition-all group",
                    index < 3 ? "hover:bg-blue-50 dark:hover:bg-blue-900/20" : "hover:bg-gray-100 dark:hover:bg-gray-700",
                    hashtag.isActive && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      index === 0 && "text-yellow-500",
                      index === 1 && "text-gray-400",
                      index === 2 && "text-orange-400"
                    )}>
                      #{hashtag.tag}
                    </span>
                    {index < 3 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5">
                        {index === 0 ? "🔥" : index === 1 ? "⭐" : "💫"}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{hashtag.count}</span>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Add Hashtag Input */}
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Add #hashtag"
            className="flex-1 h-8 text-sm rounded-full bg-gray-100 dark:bg-gray-700 border-0"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddHashtag()}
          />
          <Button size="sm" className="rounded-full h-8 px-3" onClick={handleAddHashtag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Emoji Picker Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedEmoji}</span>
            <span className="text-sm text-gray-500">Selected emoji</span>
          </div>
          <div className="relative" ref={emojiPickerRef}>
            <Button
              variant="outline"
              className="rounded-full gap-2 text-sm h-9"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            >
              <Smile className="h-4 w-4" />
              <span>Choose</span>
              <ChevronDown className="h-3 w-3" />
            </Button>

            {isEmojiPickerOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border dark:border-gray-700 z-50 p-3">
                <div className="grid grid-cols-5 gap-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji.label}
                      onClick={() => handleEmojiSelect(emoji.icon)}
                      className={cn(
                        "p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-2xl",
                        selectedEmoji === emoji.icon && "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500"
                      )}
                      title={emoji.label}
                    >
                      {emoji.icon}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-center text-xs text-gray-500">
                  Click any emoji to select
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <h2 className="font-semibold text-lg mb-3">Categories</h2>
        <div className="space-y-1">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <category.icon className="h-5 w-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
              <span className="text-sm font-medium">{category.name}</span>
              <ChevronDown className="h-4 w-4 ml-auto text-gray-400 group-hover:text-blue-500 transition-colors rotate-[-90deg]" />
            </Link>
          ))}
        </div>
      </div>

      {/* Weather Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌤️</span>
            <div>
              <p className="text-2xl font-bold">28°C</p>
              <p className="text-sm text-gray-500">Partly cloudy</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Today
          </Badge>
        </div>
      </div>
    </div>
  );
}