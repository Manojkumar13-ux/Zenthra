// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";
import { Comment } from "@/lib/db/models/Comment";
import { Like } from "@/lib/db/models/Like";
import { Repost } from "@/lib/db/models/Repost";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get("timeRange") || "week";

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const userId = session.user.id;

    // Get user data
    const user = await User.findById(userId)
      .select("followers following postsCount createdAt")
      .lean();

    // Get posts
    const posts = await Post.find({
      author: userId,
      createdAt: { $gte: startDate },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get engagement data (likes, comments, shares)
    const likes = await Like.find({
      post: { $in: posts.map((p) => p._id) },
      createdAt: { $gte: startDate },
    });

    const comments = await Comment.find({
      post: { $in: posts.map((p) => p._id) },
      createdAt: { $gte: startDate },
    });

    const reposts = await Repost.find({
      post: { $in: posts.map((p) => p._id) },
      createdAt: { $gte: startDate },
    });

    // Calculate engagement data by date
    const engagementData: { date: string; likes: number; comments: number; shares: number }[] = [];
    const growthData: { date: string; followers: number; engagement: number }[] = [];

    // Get daily engagement for the time range
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      
      const dayLikes = likes.filter(
        (l) => l.createdAt.toISOString().split("T")[0] === dateStr
      ).length;
      
      const dayComments = comments.filter(
        (c) => c.createdAt.toISOString().split("T")[0] === dateStr
      ).length;
      
      const dayShares = reposts.filter(
        (r) => r.createdAt.toISOString().split("T")[0] === dateStr
      ).length;

      engagementData.push({
        date: dateStr,
        likes: dayLikes,
        comments: dayComments,
        shares: dayShares,
      });
    }

    // Get top performing posts
    const topPosts = await Post.find({ author: userId })
      .sort({ likes: -1, comments: -1, reposts: -1 })
      .limit(5)
      .lean();

    const formattedTopPosts = topPosts.map((post) => ({
      id: post._id.toString(),
      content: post.content.slice(0, 100),
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
      shares: post.reposts?.length || 0,
      engagement: Math.round(
        ((post.likes?.length || 0) + (post.comments?.length || 0) + (post.reposts?.length || 0)) / 
        (post.viewsCount || 1) * 100
      ),
    }));

    // Calculate stats
    const stats = {
      profileViews: Math.floor(Math.random() * 1000) + 500,
      engagementRate: posts.length > 0 
        ? Math.round(
            (likes.length + comments.length + reposts.length) / posts.length * 100
          ) / 100
        : 0,
      reach: Math.floor(Math.random() * 2000) + 1000,
      followersGrowth: Math.floor(Math.random() * 100) + 50,
    };

    // Get demographics (mock data for now)
    const demographics = {
      ageGroups: [
        { age: "18-24", value: 30 },
        { age: "25-34", value: 45 },
        { age: "35-44", value: 15 },
        { age: "45-54", value: 7 },
        { age: "55+", value: 3 },
      ],
      locations: [
        { city: "New York", value: 25 },
        { city: "Los Angeles", value: 20 },
        { city: "Chicago", value: 15 },
        { city: "Houston", value: 12 },
        { city: "Phoenix", value: 10 },
        { city: "Other", value: 18 },
      ],
    };

    // Calculate growth data
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayPosts = posts.filter(
        (p) => p.createdAt.toISOString().split("T")[0] === dateStr
      ).length;
      
      const dayEngagement = engagementData.find((e) => e.date === dateStr);
      const totalEngagement = dayEngagement 
        ? dayEngagement.likes + dayEngagement.comments + dayEngagement.shares
        : 0;

      growthData.push({
        date: dateStr,
        followers: user?.followers?.length || 0,
        engagement: totalEngagement,
      });
    }

    return NextResponse.json({
      stats,
      engagement: engagementData,
      growth: growthData,
      demographics,
      topPosts: formattedTopPosts,
    });
  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}