export const dynamic = 'force-dynamic';

// app/api/trending/refresh/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Hashtag } from "@/lib/db/models/Hashtag";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Update trending status for hashtags with count >= 3
    await Hashtag.updateMany(
      { count: { $gte: 3 } },
      { $set: { isTrending: true } }
    );

    // Reset trending for hashtags with count < 3
    await Hashtag.updateMany(
      { count: { $lt: 3 } },
      { $set: { isTrending: false } }
    );

    return NextResponse.json({ success: true, message: "Trending refreshed" });
  } catch (error) {
    console.error("Error refreshing trending:", error);
    return NextResponse.json(
      { error: "Failed to refresh trending" },
      { status: 500 }
    );
  }
}