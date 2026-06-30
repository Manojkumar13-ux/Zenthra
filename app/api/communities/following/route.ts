// app/api/communities/following/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    const follows = await db.collection("communityFollows")
      .find({ userId: session.user.id })
      .toArray();

    const communityIds = follows.map(f => f.communityId);

    return NextResponse.json({ communities: communityIds });
  } catch (error) {
    console.error("Error fetching following communities:", error);
    return NextResponse.json({ error: "Failed to fetch following communities" }, { status: 500 });
  }
}