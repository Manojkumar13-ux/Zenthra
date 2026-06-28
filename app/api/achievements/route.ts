import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("posts followers following")
      .lean();

    if (!user) {
      return NextResponse.json({ achievements: [] });
    }

    // Calculate achievements based on user data
    const achievements = [];

    // First post
    if (user.posts && user.posts.length > 0) {
      achievements.push({
        id: "first_post",
        name: "First Post",
        description: "Created your first post",
        icon: "📝",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Post count achievements
    if (user.posts && user.posts.length >= 10) {
      achievements.push({
        id: "posts_10",
        name: "10 Posts",
        description: "Created 10 posts",
        icon: "✍️",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }

    if (user.posts && user.posts.length >= 50) {
      achievements.push({
        id: "posts_50",
        name: "50 Posts",
        description: "Created 50 posts",
        icon: "📚",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Followers achievements
    if (user.followers && user.followers.length >= 10) {
      achievements.push({
        id: "followers_10",
        name: "10 Followers",
        description: "Gained 10 followers",
        icon: "👥",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }

    if (user.followers && user.followers.length >= 100) {
      achievements.push({
        id: "followers_100",
        name: "100 Followers",
        description: "Gained 100 followers",
        icon: "🌟",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Following achievements
    if (user.following && user.following.length >= 10) {
      achievements.push({
        id: "following_10",
        name: "Following 10",
        description: "Following 10 users",
        icon: "🔗",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      });
    }

    // Add locked achievements
    const allAchievements = [
      { id: "first_post", name: "First Post", description: "Create your first post", icon: "📝" },
      { id: "posts_10", name: "10 Posts", description: "Create 10 posts", icon: "✍️" },
      { id: "posts_50", name: "50 Posts", description: "Create 50 posts", icon: "📚" },
      { id: "posts_100", name: "100 Posts", description: "Create 100 posts", icon: "🏆" },
      { id: "followers_10", name: "10 Followers", description: "Gain 10 followers", icon: "👥" },
      { id: "followers_100", name: "100 Followers", description: "Gain 100 followers", icon: "🌟" },
      { id: "followers_1000", name: "1000 Followers", description: "Gain 1000 followers", icon: "👑" },
      { id: "following_10", name: "Following 10", description: "Follow 10 users", icon: "🔗" },
      { id: "following_50", name: "Following 50", description: "Follow 50 users", icon: "🤝" },
    ];

    const unlockedIds = achievements.map(a => a.id);
    const lockedAchievements = allAchievements
      .filter(a => !unlockedIds.includes(a.id))
      .map(a => ({
        ...a,
        unlocked: false,
      }));

    return NextResponse.json([...achievements, ...lockedAchievements]);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}