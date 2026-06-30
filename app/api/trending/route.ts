// app/api/hashtags/trending/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

export async function POST(request: Request) {
  try {
    const db = await connectToDatabase();
    const body = await request.json();
    const { tag } = body;

    if (!tag) {
      return NextResponse.json({ error: "Tag is required" }, { status: 400 });
    }

    const cleanTag = tag.toLowerCase().trim();
    
    const result = await db.collection("hashtags").findOneAndUpdate(
      { tag: cleanTag },
      { 
        $inc: { count: 1 },
        $set: { lastUsed: new Date() },
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({ hashtag: result });
  } catch (error) {
    console.error("Error updating hashtag:", error);
    return NextResponse.json({ error: "Failed to update hashtag" }, { status: 500 });
  }
}