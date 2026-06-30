// app/api/achievements/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Return achievements with mock data
    const achievements = [
      {
        id: "1",
        title: "First Post",
        description: "Created your first post",
        icon: "📝",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      },
      {
        id: "2",
        title: "Liked It",
        description: "Liked 10 posts",
        icon: "❤️",
        unlocked: false,
        progress: 3,
        maxProgress: 10,
      },
      {
        id: "3",
        title: "Commentator",
        description: "Left 5 comments",
        icon: "💬",
        unlocked: false,
        progress: 2,
        maxProgress: 5,
      },
    ];

    const unlocked = achievements.filter(a => a.unlocked).length;

    return NextResponse.json({
      achievements,
      stats: {
        total: achievements.length,
        unlocked,
        locked: achievements.length - unlocked,
        progress: Math.round((unlocked / achievements.length) * 100),
      }
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({
      achievements: [],
      stats: { total: 0, unlocked: 0, locked: 0, progress: 0 }
    });
  }
}