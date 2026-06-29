// app/api/achievements/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth"; // ✅ Fixed import

import { connectDB } from "@/lib/db/connect";

import { Achievement } from "@/lib/db/models/Achievement";


export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const achievements = await Achievement.find({
      user: session.user.id,
    })
      .sort({ unlockedAt: -1 })
      .lean();

    const formattedAchievements = achievements.map((achievement: any) => ({
      ...achievement,
      _id: achievement._id.toString(),
      unlockedAt: achievement.unlockedAt?.toISOString(),
    }));

    return NextResponse.json({ achievements: formattedAchievements });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 });
  }
}
