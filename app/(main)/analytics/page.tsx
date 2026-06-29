// app/(main)/analytics/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
} from "lucide-react";

const COLORS = ["#4F46E5", "#7C3AED", "#EC4899", "#EF4444", "#F59E0B", "#10B981", "#3B82F6"];

interface LocationData {
  city: string;
  value: number;
}

interface AgeGroupData {
  age: string;
  value: number;
}

interface PostData {
  id: string;
  content: string;
  likes: number;
  comments: number;
  shares: number;
  engagement: number;
}

interface AnalyticsStats {
  profileViews: number;
  engagementRate: number;
  reach: number;
  followersGrowth: number;
}

interface AnalyticsData {
  stats: AnalyticsStats;
  engagement: Array<{
    date: string;
    likes: number;
    comments: number;
    shares: number;
  }>;
  growth: Array<{
    date: string;
    followers: number;
    engagement: number;
  }>;
  demographics: {
    ageGroups: AgeGroupData[];
    locations: LocationData[];
  };
  topPosts: PostData[];
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [chartType, setChartType] = useState<"overview" | "engagement" | "demographics">(
    "overview"
  );

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics", timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?timeRange=${timeRange}`);
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  const handleExportPDF = async () => {
    toast.success("PDF export coming soon!");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const engagementData = data?.engagement || [];
  const growthData = data?.growth || [];
  const demographics = data?.demographics || {};
  const topPosts = data?.topPosts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Analytics</h1>
          <Badge variant="outline" className="text-xs">
            AI Powered
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Tabs
            value={timeRange}
            onValueChange={(v) => setTimeRange(v as "week" | "month" | "year")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="week" className="text-xs">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs">
                Month
              </TabsTrigger>
              <TabsTrigger value="year" className="text-xs">
                Year
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Profile Views</p>
                <p className="text-2xl font-bold">{stats.profileViews || 0}</p>
                <p className="flex items-center gap-0.5 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +12%
                </p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2 dark:bg-indigo-900/30">
                <Eye className="h-5 w-5 text-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Engagement</p>
                <p className="text-2xl font-bold">{stats.engagementRate || 0}%</p>
                <p className="flex items-center gap-0.5 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +8%
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-900/30">
                <Heart className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Reach</p>
                <p className="text-2xl font-bold">{stats.reach || 0}</p>
                <p className="flex items-center gap-0.5 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +15%
                </p>
              </div>
              <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-900/30">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Followers Growth</p>
                <p className="text-2xl font-bold">{stats.followersGrowth || 0}</p>
                <p className="flex items-center gap-0.5 text-xs text-green-500">
                  <TrendingUp className="h-3 w-3" />
                  +24%
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Type Tabs */}
      <Tabs
        value={chartType}
        onValueChange={(v) => setChartType(v as "overview" | "engagement" | "demographics")}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {chartType === "overview" && "Growth Overview"}
            {chartType === "engagement" && "Engagement Metrics"}
            {chartType === "demographics" && "Audience Demographics"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-full grid-cols-1 gap-4 md:grid-cols-2">
            {chartType === "overview" && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stackId="1"
                    stroke="#4F46E5"
                    fill="#4F46E5"
                    fillOpacity={0.2}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stackId="1"
                    stroke="#7C3AED"
                    fill="#7C3AED"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            {chartType === "engagement" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={engagementData}>
                  <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="likes" fill="#EC4899" />
                  <Bar dataKey="comments" fill="#3B82F6" />
                  <Bar dataKey="shares" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            )}
            {chartType === "demographics" && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-sm font-medium">Age Distribution</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={demographics.ageGroups || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(demographics.ageGroups || []).map(
                          (entry: AgeGroupData, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          )
                        )}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium">Top Locations</p>
                  <div className="space-y-2">
                    {(demographics.locations || []).map((loc: LocationData, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{loc.city}</span>
                        <span className="text-sm font-medium">{loc.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-300">
              🕐 Best posting time: <strong>8:00 PM</strong> (highest engagement)
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              📊 Top performing content type: <strong>Images</strong>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              🎯 Your audience engages most with: <strong>Tech & AI</strong> content
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Top Performing Posts</h2>
        <div className="space-y-3">
          {topPosts.map((post: PostData, i: number) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="text-xs">
                    #{i + 1}
                  </Badge>
                  <p className="line-clamp-1 flex-1 text-sm">{post.content}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <Heart className="h-3 w-3" /> {post.likes}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <MessageCircle className="h-3 w-3" /> {post.comments}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Share2 className="h-3 w-3" /> {post.shares}
                    </span>
                    <span className="flex items-center gap-0.5 text-green-500">
                      <TrendingUp className="h-3 w-3" /> {post.engagement}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
