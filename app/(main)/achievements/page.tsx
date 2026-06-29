// app/(main)/achievements/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Star,
  Award,
  Crown,
  Zap,
  Flame,
  Rocket,
  Medal,
  Sparkles,
  Loader2,
  Lock,
  CheckCircle,
  TrendingUp,
  Heart,
  MessageCircle,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  xp: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface Level {
  level: number;
  title: string;
  xp: number;
}

const levelData: Level[] = [
  { level: 1, title: "Newbie", xp: 0 },
  { level: 2, title: "Rookie", xp: 100 },
  { level: 3, title: "Explorer", xp: 250 },
  { level: 4, title: "Enthusiast", xp: 500 },
  { level: 5, title: "Contributor", xp: 1000 },
  { level: 6, title: "Leader", xp: 2000 },
  { level: 7, title: "Champion", xp: 3500 },
  { level: 8, title: "Master", xp: 5000 },
  { level: 9, title: "Legend", xp: 7500 },
  { level: 10, title: "Icon", xp: 10000 },
];

const tierColors: Record<string, string> = {
  bronze: "bg-amber-600 text-amber-600",
  silver: "bg-gray-400 text-gray-400",
  gold: "bg-yellow-500 text-yellow-500",
  platinum: "bg-cyan-400 text-cyan-400",
  diamond: "bg-blue-400 text-blue-400",
};

const tierBadgeColors: Record<string, string> = {
  bronze: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  silver: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  gold: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  platinum: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  diamond: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const iconMap: Record<string, React.ReactNode> = {
  trophy: <Trophy className="h-6 w-6" />,
  star: <Star className="h-6 w-6" />,
  award: <Award className="h-6 w-6" />,
  crown: <Crown className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  flame: <Flame className="h-6 w-6" />,
  rocket: <Rocket className="h-6 w-6" />,
  medal: <Medal className="h-6 w-6" />,
  sparkles: <Sparkles className="h-6 w-6" />,
  trending: <TrendingUp className="h-6 w-6" />,
  heart: <Heart className="h-6 w-6" />,
  message: <MessageCircle className="h-6 w-6" />,
  users: <Users className="h-6 w-6" />,
  calendar: <Calendar className="h-6 w-6" />,
  clock: <Clock className="h-6 w-6" />,
};

export default function AchievementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchAchievements();
    }
  }, [session, status, router]);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/achievements");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to fetch achievements");
      }
      const data = await res.json();
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      setError(error instanceof Error ? error.message : "Failed to load achievements");
    } finally {
      setIsLoading(false);
    }
  };

  const getLevel = (xp: number): { current: Level; next: Level; progress: number } => {
    let current = levelData[0];
    let next = levelData[1];

    for (let i = levelData.length - 1; i >= 0; i--) {
      if (xp >= levelData[i].xp) {
        current = levelData[i];
        next = levelData[i + 1] || levelData[i];
        break;
      }
    }

    const progress =
      next.xp > current.xp ? ((xp - current.xp) / (next.xp - current.xp)) * 100 : 100;

    return { current, next, progress: Math.min(progress, 100) };
  };

  const totalXP = achievements.reduce((sum, a) => sum + (a.unlocked ? a.xp : 0), 0);
  const { current: currentLevel, next: nextLevel, progress: levelProgress } = getLevel(totalXP);

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "earned") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });

  const earnedCount = achievements.filter((a) => a.unlocked).length;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl p-4 text-center">
        <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h2 className="mb-2 text-lg font-semibold">No achievements</h2>
        <p className="mb-4 text-muted-foreground">Sign in to view your achievements</p>
        <Button onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <h1 className="text-2xl font-bold">Achievements</h1>
        <Badge variant="outline" className="ml-2">
          {earnedCount} / {achievements.length} earned
        </Badge>
      </div>

      {/* Level Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Level {currentLevel.level}: {currentLevel.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {totalXP} / {nextLevel.xp} XP
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {Math.round(levelProgress)}% to level {nextLevel.level}
            </Badge>
          </div>
          <Progress value={levelProgress} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-gray-400">
            {earnedCount} achievements earned • {totalXP} total XP
          </p>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="mb-3 flex items-center justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "earned" | "locked")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="earned">Earned</TabsTrigger>
            <TabsTrigger value="locked">Locked</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Achievements Grid */}
      {error ? (
        <div className="py-12 text-center">
          <p className="text-red-500">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchAchievements}>
            Try Again
          </Button>
        </div>
      ) : filteredAchievements.length === 0 ? (
        <div className="py-12 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-gray-500">
            {filter === "all"
              ? "No achievements found"
              : filter === "earned"
                ? "You haven't earned any achievements yet"
                : "All achievements earned! 🎉"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map((achievement) => {
            const isUnlocked = achievement.unlocked;
            const color = tierColors[achievement.tier] || "text-gray-500";
            const badgeColor = tierBadgeColors[achievement.tier] || "bg-gray-100 text-gray-700";
            const Icon = iconMap[achievement.icon] || <Trophy className="h-6 w-6" />;

            return (
              <Card
                key={achievement._id}
                className={cn(
                  "transition-all duration-200",
                  isUnlocked ? "hover:shadow-md" : "opacity-60 grayscale hover:opacity-70"
                )}
              >
                <CardContent className="p-4 text-center">
                  <div
                    className={cn(
                      "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full",
                      color,
                      isUnlocked ? "bg-opacity-20" : "bg-opacity-10"
                    )}
                  >
                    {isUnlocked ? Icon : <Lock className="h-6 w-6" />}
                  </div>
                  <h3 className="text-sm font-semibold">{achievement.title}</h3>
                  <p className="line-clamp-2 text-xs text-gray-500">{achievement.description}</p>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Badge variant="outline" className={cn("px-1.5 text-[10px]", badgeColor)}>
                      {achievement.tier}
                    </Badge>
                    <Badge variant="outline" className="px-1.5 text-[10px]">
                      +{achievement.xp} XP
                    </Badge>
                    {isUnlocked && (
                      <Badge className="bg-green-500 text-xs">
                        <CheckCircle className="mr-0.5 h-3 w-3" />
                        Earned
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
