// components/shared/RightSidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrendingUp,
  Hash,
  UserPlus,
  UserCheck,
  Smile,
  ChevronDown,
  X,
  Loader2,
  Cloud,
  Wind,
  Droplets,
  Clock,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TrendingHashtag {
  _id: string;
  tag: string;
  count: number;
}

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  image?: string | null;
  bio?: string;
  mutualFollowers?: number;
  isFollowing?: boolean;
}

const emojis = [
  { icon: "😊", label: "Smile" },
  { icon: "😂", label: "Laugh" },
  { icon: "❤️", label: "Love" },
  { icon: "👍", label: "Like" },
  { icon: "🔥", label: "Fire" },
  { icon: "🎉", label: "Party" },
  { icon: "✨", label: "Sparkle" },
  { icon: "⭐", label: "Star" },
  { icon: "🚀", label: "Rocket" },
  { icon: "👑", label: "Crown" },
  { icon: "💡", label: "Idea" },
  { icon: "☕", label: "Coffee" },
  { icon: "🍕", label: "Pizza" },
  { icon: "🎁", label: "Gift" },
  { icon: "🐛", label: "Bug" },
  { icon: "😡", label: "Angry" },
  { icon: "😢", label: "Sad" },
  { icon: "😐", label: "Meh" },
  { icon: "⚡", label: "Zap" },
  { icon: "🌙", label: "Moon" },
];

export function RightSidebar() {
  const { data: session } = useSession();
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [selectedEmoji, setSelectedEmoji] = useState<string>("😊");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [newHashtag, setNewHashtag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  useEffect(() => {
    fetchTrendingHashtags();
    fetchSuggestedUsers();

    const handleNewPost = (event: CustomEvent) => {
      const { hashtags } = event.detail;
      if (hashtags && hashtags.length > 0) {
        updateTrendingHashtags(hashtags);
      }
    };

    window.addEventListener("newPost" as any, handleNewPost);
    return () => {
      window.removeEventListener("newPost" as any, handleNewPost);
    };
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/hashtags/trending");
      if (res.ok) {
        const data = await res.json();
        setTrendingHashtags(data.hashtags || []);
      } else {
        setTrendingHashtags([
          { _id: "1", tag: "movie", count: 7 },
          { _id: "2", tag: "music", count: 5 },
          { _id: "3", tag: "tech", count: 4 },
          { _id: "4", tag: "gaming", count: 3 },
          { _id: "5", tag: "sports", count: 2 },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch trending hashtags:", error);
      setTrendingHashtags([
        { _id: "1", tag: "movie", count: 7 },
        { _id: "2", tag: "music", count: 5 },
        { _id: "3", tag: "tech", count: 4 },
        { _id: "4", tag: "gaming", count: 3 },
        { _id: "5", tag: "sports", count: 2 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedUsers = async () => {
    try {
      setIsUsersLoading(true);
      // ✅ Fetch real users from database
      const res = await fetch("/api/users/suggested");
      if (res.ok) {
        const data = await res.json();
        // ✅ Only show real users from database
        if (data.users && data.users.length > 0) {
          setSuggestedUsers(data.users);
        } else {
          // If no users in database, show empty state
          setSuggestedUsers([]);
        }
      } else {
        // If API fails, show empty state (no mock data)
        setSuggestedUsers([]);
      }
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
      setSuggestedUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const updateTrendingHashtags = (hashtags: string[]) => {
    setTrendingHashtags((prev) => {
      const updated = [...prev];
      hashtags.forEach((tag) => {
        const cleanTag = tag.startsWith("#") ? tag.slice(1) : tag;
        const existing = updated.find((h) => h.tag.toLowerCase() === cleanTag.toLowerCase());
        if (existing) {
          existing.count += 1;
        } else {
          updated.push({
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
            tag: cleanTag,
            count: 1,
          });
        }
      });
      return updated.sort((a, b) => b.count - a.count).slice(0, 10);
    });
  };

  const handleFollowUser = async (userId: string) => {
    setSuggestedUsers((prev) =>
      prev.map((user) =>
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
      )
    );
    try {
      const user = suggestedUsers.find((u) => u.id === userId);
      const isFollowing = user?.isFollowing;
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || (isFollowing ? "Unfollowed" : "Followed"));
        // Refresh suggestions after follow
        fetchSuggestedUsers();
      } else {
        setSuggestedUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
          )
        );
        toast.error("Failed to update follow status");
      }
    } catch (error) {
      console.error("Failed to follow user:", error);
      setSuggestedUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isFollowing: !u.isFollowing } : u
        )
      );
      toast.error("Failed to update follow status");
    }
  };

  const handleAddHashtag = async () => {
    if (!newHashtag.trim()) {
      toast.error("Please enter a hashtag");
      return;
    }
    const cleanTag = newHashtag.trim().startsWith("#") ? newHashtag.trim().slice(1) : newHashtag.trim();
    
    const existing = trendingHashtags.find((h) => h.tag.toLowerCase() === cleanTag.toLowerCase());
    if (existing) {
      setTrendingHashtags((prev) =>
        prev
          .map((h) =>
            h.tag.toLowerCase() === cleanTag.toLowerCase() ? { ...h, count: h.count + 1 } : h
          )
          .sort((a, b) => b.count - a.count)
      );
      setNewHashtag("");
      toast.success(`#${cleanTag} count increased!`);
      return;
    }

    try {
      const res = await fetch("/api/hashtags/trending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: cleanTag }),
      });
      if (res.ok) {
        const data = await res.json();
        setTrendingHashtags((prev) => {
          const newHashtag = {
            _id: data.hashtag?._id || Date.now().toString(),
            tag: cleanTag,
            count: 1,
          };
          return [newHashtag, ...prev].sort((a, b) => b.count - a.count);
        });
        setNewHashtag("");
        toast.success(`#${cleanTag} added to trending!`);
      } else {
        const newHashtagObj = { _id: Date.now().toString(), tag: cleanTag, count: 1 };
        setTrendingHashtags((prev) => [newHashtagObj, ...prev].sort((a, b) => b.count - a.count));
        setNewHashtag("");
        toast.success(`#${cleanTag} added locally!`);
      }
    } catch (error) {
      const newHashtagObj = { _id: Date.now().toString(), tag: cleanTag, count: 1 };
      setTrendingHashtags((prev) => [newHashtagObj, ...prev].sort((a, b) => b.count - a.count));
      setNewHashtag("");
      toast.success(`#${cleanTag} added!`);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setIsEmojiPickerOpen(false);
    toast.success(`Selected ${emoji}`);
  };

  return (
    <aside className="hidden xl:block w-80 border-l dark:border-gray-800 bg-white dark:bg-gray-900 overflow-y-auto flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] p-4 space-y-4">
      <div className="rounded-xl border dark:border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Trending Hashtags</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-2">
            {trendingHashtags.length === 0 ? (
              <div className="py-4 text-center">
                <Hash className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500">No trending hashtags yet</p>
                <p className="mt-1 text-xs text-gray-400">Start using #hashtags in your posts!</p>
              </div>
            ) : (
              trendingHashtags.slice(0, 8).map((hashtag) => (
                <Link
                  key={hashtag._id}
                  href={`/explore?q=${hashtag.tag}`}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">#{hashtag.tag}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {hashtag.count} {hashtag.count === 1 ? "post" : "posts"}
                  </Badge>
                </Link>
              ))
            )}
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Add #hashtag"
            className="h-8 flex-1 rounded-full border-0 bg-gray-100 text-sm dark:bg-gray-800"
            value={newHashtag}
            onChange={(e) => setNewHashtag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddHashtag()}
          />
          <Button size="sm" className="h-8 rounded-full px-3" onClick={handleAddHashtag}>
            Add
          </Button>
        </div>
      </div>

      <div className="rounded-xl border dark:border-gray-800 p-4">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-semibold">Suggested for you</h2>
        </div>
        {isUsersLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {suggestedUsers.length === 0 ? (
              <div className="py-4 text-center">
                <UserPlus className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-500">No new users to follow</p>
                <p className="mt-1 text-xs text-gray-400">Check back later for suggestions</p>
              </div>
            ) : (
              suggestedUsers.slice(0, 3).map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <AvatarSimple src={user.image} fallback={user.name?.[0] || "U"} alt={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${user.id}`} className="font-medium text-sm hover:text-blue-500 transition-colors truncate block">
                      {user.name}
                    </Link>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    {user.mutualFollowers && user.mutualFollowers > 0 && (
                      <p className="text-xs text-gray-400">{user.mutualFollowers} mutual followers</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={user.isFollowing ? "default" : "outline"}
                    className={cn(
                      "h-7 text-xs gap-1",
                      user.isFollowing && "bg-green-500 hover:bg-green-600 text-white"
                    )}
                    onClick={() => handleFollowUser(user.id)}
                  >
                    {user.isFollowing ? <UserCheck className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                    {user.isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedEmoji}</span>
            <span className="text-sm text-gray-500">Selected emoji</span>
          </div>
          <div className="relative">
            <Button
              variant="outline"
              className="h-9 gap-2 rounded-full text-sm"
              onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            >
              <Smile className="h-4 w-4" />
              <span>Choose</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
            {isEmojiPickerOpen && (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border bg-white p-3 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">Select an emoji</span>
                  <button onClick={() => setIsEmojiPickerOpen(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji.label}
                      onClick={() => handleEmojiSelect(emoji.icon)}
                      className={cn(
                        "rounded-lg p-2 text-2xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-700",
                        selectedEmoji === emoji.icon && "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20"
                      )}
                      title={emoji.label}
                    >
                      {emoji.icon}
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t pt-2 flex justify-between">
                  <button
                    onClick={() => { setSelectedEmoji("😊"); setIsEmojiPickerOpen(false); }}
                    className="text-xs text-gray-500 hover:text-blue-500"
                  >
                    Reset to 😊
                  </button>
                  <span className="text-xs text-gray-400">Click any emoji</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌤️</span>
            <div>
              <p className="text-2xl font-bold">32°C</p>
              <p className="text-sm text-gray-500">Partly sunny</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">Today</Badge>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> 12 km/h</span>
          <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> 65%</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 6:42 AM</span>
        </div>
      </div>
    </aside>
  );
}
