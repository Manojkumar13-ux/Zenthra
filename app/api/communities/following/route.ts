export const dynamic = 'force-dynamic';

// app/api/communities/following/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    // Find all communities that the current user is following
    const follows = await db.collection("communityFollows")
      .find({ userId: session.user.id })
      .toArray();

    const communityIds = follows.map(f => f.communityId);

    // Get community details
    let communities: any[] = [];
    if (communityIds.length > 0) {
      const objectIds = communityIds.map(id => new ObjectId(id));
      communities = await db.collection("communities")
        .find({ _id: { $in: objectIds } })
        .project({ name: 1, slug: 1, description: 1, image: 1 })
        .toArray();
    }

    return NextResponse.json({ 
      communities: communityIds,
      communityDetails: communities 
    });
  } catch (error) {
    console.error("Error fetching following communities:", error);
    return NextResponse.json(
      { error: "Failed to fetch following communities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const body = await request.json();
    const { communityId } = body;

    if (!communityId) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(communityId)) {
      return NextResponse.json(
        { error: "Invalid community ID" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await db.collection("communityFollows").findOne({
      userId: session.user.id,
      communityId: communityId,
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this community" },
        { status: 400 }
      );
    }

    await db.collection("communityFollows").insertOne({
      userId: session.user.id,
      communityId: communityId,
      createdAt: new Date(),
    });

    // Update community follower count
    await db.collection("communities").updateOne(
      { _id: new ObjectId(communityId) },
      { $inc: { followers: 1 } }
    );

    return NextResponse.json({ 
      message: "Community followed successfully",
      following: true 
    });
  } catch (error) {
    console.error("Error following community:", error);
    return NextResponse.json(
      { error: "Failed to follow community" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");

    if (!communityId) {
      return NextResponse.json(
        { error: "Community ID is required" },
        { status: 400 }
      );
    }

    if (!ObjectId.isValid(communityId)) {
      return NextResponse.json(
        { error: "Invalid community ID" },
        { status: 400 }
      );
    }

    await db.collection("communityFollows").deleteOne({
      userId: session.user.id,
      communityId: communityId,
    });

    // Update community follower count
    await db.collection("communities").updateOne(
      { _id: new ObjectId(communityId) },
      { $inc: { followers: -1 } }
    );

    return NextResponse.json({ 
      message: "Community unfollowed successfully",
      following: false 
    });
  } catch (error) {
    console.error("Error unfollowing community:", error);
    return NextResponse.json(
      { error: "Failed to unfollow community" },
      { status: 500 }
    );
  }
}