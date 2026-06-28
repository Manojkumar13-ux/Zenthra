"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Award, 
  Star, 
  Users, 
  Crown, 
  Sparkles,
  Zap,
  Trophy,
  Medal,
  Target,
  Rocket,
  Heart,
  MessageCircle,
  Repeat,
  BookOpen,
  Hash,
  TrendingUp,
} from "lucide-react";

interface BadgeCardProps {
  badge: {
    _id: string;
    type: string;
    name: string;
    description: string;
    icon?: string;
    unlocked?: boolean;
    unlockedAt?: Date;
    progress?: number;
    maxProgress?: number;
  };
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  onClick?: () => void;
}

const badgeIcons: Record<string, any> = {
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
};

const badgeColors: Record<string, string> = {
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
};

const badgeLabels: Record<string, string> = {
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
};

export function BadgeCard({ 
  badge, 
  size = "md", 
  showProgress = false,
  onClick 
}: BadgeCardProps) {
  const Icon = badgeIcons[badge.type] || Award;
  const color = badgeColors[badge.type] || "bg-gray-500";
  const label = badgeLabels[badge.type] || badge.name;
  const isUnlocked = badge.unlocked !== undefined ? badge.unlocked : true;
  const progress = badge.progress || 0;
  const maxProgress = badge.maxProgress || 100;
  const percentage = Math.min((progress / maxProgress) * 100, 100);

  const sizes = {
    sm: {
      icon: "h-6 w-6",
      container: "p-3",
      title: "text-sm",
      description: "text-xs",
      badge: "h-12 w-12",
    },
    md: {
      icon: "h-8 w-8",
      container: "p-4",
      title: "text-base",
      description: "text-sm",
      badge: "h-16 w-16",
    },
    lg: {
      icon: "h-10 w-10",
      container: "p-6",
      title: "text-lg",
      description: "text-base",
      badge: "h-20 w-20",
    },
  };

  const currentSize = sizes[size];

  return (
    <Card 
      className={cn(
        "flex items-center gap-4 transition-all duration-200 cursor-pointer",
        currentSize.container,
        isUnlocked ? "hover:shadow-lg" : "opacity-50 grayscale",
        onClick && "hover:scale-105"
      )}
      onClick={onClick}
    >
      <div className={cn(
        "rounded-full flex items-center justify-center flex-shrink-0",
        color,
        currentSize.badge,
        isUnlocked ? "bg-opacity-20" : "bg-opacity-10"
      )}>
        <Icon className={cn(
          currentSize.icon,
          isUnlocked ? "text-white" : "text-gray-400"
        )} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn(
            "font-semibold truncate",
            currentSize.title,
            isUnlocked ? "text-gray-900 dark:text-gray-100" : "text-gray-400"
          )}>
            {label}
          </h4>
          {!isUnlocked && (
            <span className="text-xs text-gray-400">Locked</span>
          )}
          {isUnlocked && badge.unlockedAt && (
            <span className="text-xs text-gray-400">
              {new Date(badge.unlockedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <p className={cn(
          "text-gray-500 truncate",
          currentSize.description
        )}>
          {badge.description}
        </p>

        {showProgress && !isUnlocked && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(percentage)}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className="mt-1 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-yellow-500" />
            <span className="text-xs text-yellow-500">Unlocked</span>
          </div>
        )}
      </div>
    </Card>
  );
}