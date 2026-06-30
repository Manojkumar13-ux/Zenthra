// app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "week";

    // Mock analytics data
    const data = {
      timeRange,
      posts: {
        total: 42,
        thisPeriod: 12,
        trend: 15,
      },
      likes: {
        total: 380,
        thisPeriod: 89,
        trend: 22,
      },
      comments: {
        total: 124,
        thisPeriod: 34,
        trend: 8,
      },
      followers: {
        total: 56,
        thisPeriod: 12,
        trend: 25,
      },
      views: {
        total: 1240,
        thisPeriod: 320,
        trend: 18,
      },
      engagement: {
        rate: 4.2,
        trend: 5,
      },
      dailyData: [
        { day: "Mon", posts: 3, likes: 15, comments: 4 },
        { day: "Tue", posts: 2, likes: 12, comments: 3 },
        { day: "Wed", posts: 4, likes: 18, comments: 6 },
        { day: "Thu", posts: 1, likes: 8, comments: 2 },
        { day: "Fri", posts: 3, likes: 14, comments: 5 },
        { day: "Sat", posts: 2, likes: 10, comments: 3 },
        { day: "Sun", posts: 3, likes: 16, comments: 4 },
      ],
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}