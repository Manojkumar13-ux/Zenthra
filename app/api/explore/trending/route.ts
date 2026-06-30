export const dynamic = 'force-dynamic';

// app/api/hashtags/trending/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await connectToDatabase();
    
    const hashtags = await db.collection("hashtags")
      .find({})
      .sort({ count: -1 })
      .limit(20)
      .toArray();

    return NextResponse.json({ hashtags });
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    return NextResponse.json({ error: "Failed to fetch hashtags" }, { status: 500 });
  }
}