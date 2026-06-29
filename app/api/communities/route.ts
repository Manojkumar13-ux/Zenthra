import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Community } from "@/lib/db/models/Community";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    await connectDB();

    let query: any = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const communities = await Community.find(query)
      .populate("owner", "name username image")
      .populate("members", "name username image")
      .populate("moderators", "name username image")
      .sort({ createdAt: -1 })
      .lean();

    // Add membership status
    const communitiesWithStatus = communities.map((community: any) => {
      const memberIds = community.members?.map((m: any) => m._id.toString()) || [];
      const moderatorIds = community.moderators?.map((m: any) => m._id.toString()) || [];

      return {
        ...community,
        _id: community._id.toString(),
        isMember: memberIds.includes(session.user.id),
        isModerator: moderatorIds.includes(session.user.id),
        isOwner: community.owner?._id.toString() === session.user.id || false,
        memberCount: community.members?.length || 0,
      };
    });

    return NextResponse.json(communitiesWithStatus);
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json({ error: "Failed to fetch communities" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPrivate } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: "Community name is required" }, { status: 400 });
    }

    await connectDB();

    // Check if community name already exists
    const existing = await Community.findOne({ name: name.trim() });
    if (existing) {
      return NextResponse.json(
        { message: "A community with this name already exists" },
        { status: 400 }
      );
    }

    const community = new Community({
      name: name.trim(),
      description: description || "",
      isPrivate: isPrivate || false,
      owner: session.user.id,
      members: [session.user.id],
      moderators: [session.user.id],
    });

    await community.save();

    const populated = await Community.findById(community._id)
      .populate("owner", "name username image")
      .populate("members", "name username image")
      .populate("moderators", "name username image")
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Error creating community:", error);
    return NextResponse.json({ message: "Failed to create community" }, { status: 500 });
  }
}
