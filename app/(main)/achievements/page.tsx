"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Star,
  Award,
  Flame,
  Zap,
  Crown,
  Medal,
  Target,
  Rocket,
  Users,
  Heart,
  MessageCircle,
  Repeat,
  TrendingUp,
  Sparkles,
  Coins,
  Gem,
  Crown as CrownIcon,
  Shield,
  Coffee,
  Gift,
} from "lucide-react";

const achievementIcons: Record<string, any> = {
  first_post: Rocket,
  viral_post: Zap,
  "100_followers": Users,
  top_creator: Crown,
  community_leader: Trophy,
  engagement_master: Heart,
  comment_champion: MessageCircle,
  repost_king: Repeat,
  content_creator: Sparkles,
  trendsetter: TrendingUp,
  milestone: Medal,
  expert: Star,
  daily_streak: Flame,
  weekly_streak: Flame,
  verified: Shield,
};

const achievementColors: Record<string, string> = {
  first_post: "bg-blue-500",
  viral_post: "bg-yellow-500",
  "100_followers": "bg-purple-500",
  top_creator: "bg-indigo-500",
  community_leader: "bg-red-500",
  engagement_master: "bg-pink-500",
  comment_champion: "bg-green-500",
  repost_king: "bg-orange-500",
  content_creator: "bg-teal-500",
  trendsetter: "bg-cyan-500",
  milestone: "bg-amber-500",
  expert: "bg-violet-500",
  daily_streak: "bg-rose-500",
  weekly_streak: "bg-orange-600",
  verified: "bg-blue-600",
};

const achievementLabels: Record<string, string> = {
  first_post: "First Post",
  viral_post: "Viral Post",
  "100_followers": "100 Followers",
  top_creator: "Top Creator",
  community_leader: "Community Leader",
  engagement_master: "Engagement Master",
  comment_champion: "Comment Champion",
  repost_king: "Repost King",
  content_creator: "Content Creator",
  trendsetter: "Trendsetter",
  milestone: "Milestone",
  expert: "Expert",
  daily_streak: "Daily Streak",
  weekly_streak: "Weekly Streak",
  verified: "Verified Creator",
};

const levelRequirements = [
  { level: 1, xp: 0, title: "Newbie" },
  { level: 2, xp: 100, title: "Explorer" },
  { level: 3, xp: 250, title: "Creator" },
  { level: 4, xp: 500, title: "Influencer" },
  { level: 5, xp: 1000, title: "Star" },
  { level: 6, xp: 2000, title: "Legend" },
  { level: 7, xp: 4000, title: "Icon" },
  { level: 8, xp: 8000, title: "Superstar" },
  { level: 9, xp: 15000, title: "Mega Creator" },
  { level: 10, xp: 30000, title: "Zenthra Legend" },
];

export default function AchievementsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"all" | "earned" | "locked">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements");
      if (!res.ok) throw new Error("Failed to fetch achievements");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const userAchievements = data?.userAchievements || [];
  const allAchievements = data?.allAchievements || [];
  const xp = data?.xp || 0;
  const level = data?.level || 1;
  const coins = data?.coins || 0;
  const streak = data?.streak || 0;

  const currentLevel = levelRequirements.find(l => l.xp <= xp) || levelRequirements[0];
  const nextLevel = levelRequirements.find(l => l.xp > xp) || levelRequirements[levelRequirements.length - 1];
  const xpToNextLevel = nextLevel.xp - xp;
  const xpProgress = ((xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100;

  const filteredAchievements = allAchievements.filter((ach: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "earned") return ach.unlocked;
    return !ach.unlocked;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <Badge variant="outline" className="text-xs">
          {userAchievements.length} unlocked
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Trophy className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Level</p>
                <p className="text-xl font-bold">{level}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Coins className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Coins</p>
                <p className="text-xl font-bold">{coins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Flame className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Streak</p>
                <p className="text-xl font-bold">{streak} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">XP</p>
                <p className="text-xl font-bold">{xp}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span>Level {level}: {currentLevel.title}</span>
            <span>{xp} / {nextLevel.xp} XP</span>
          </div>
          <Progress value={xpProgress} className="h-2 mt-2" />
          <p className="text-xs text-gray-400 mt-1">
            {xpToNextLevel} XP to Level {nextLevel.level}
          </p>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Badges</h2>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="earned" className="text-xs">Earned</TabsTrigger>
              <TabsTrigger value="locked" className="text-xs">Locked</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {filteredAchievements.map((badge: any) => {
            const Icon = achievementIcons[badge.type] || Award;
            const color = achievementColors[badge.type] || "bg-gray-500";
            const label = achievementLabels[badge.type] || badge.name;
            const isUnlocked = badge.unlocked || false;

            return (
              <Card
                key={badge._id}
                className={`transition-all ${isUnlocked ? "hover:shadow-md" : "opacity-60"}`}
              >
                <CardContent className="p-4 text-center">
                  <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${color} ${isUnlocked ? "bg-opacity-20" : "bg-opacity-10"} mb-2`}>
                    <Icon className={`h-6 w-6 ${isUnlocked ? "text-white" : "text-gray-400"}`} />
                  </div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{badge.description}</p>
                  {isUnlocked ? (
                    <Badge variant="default" className="mt-2 text-xs bg-green-500">
                      ✓ Unlocked
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Locked
                    </Badge>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}