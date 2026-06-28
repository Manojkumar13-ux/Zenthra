import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Find users who have been active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineUsers = await User.find({
      online: true,
      lastActive: { $gte: fiveMinutesAgo },
      _id: { $ne: session.user.id },
    })
      .select("name username image")
      .limit(50)
      .lean();

    return NextResponse.json({ users: onlineUsers });
  } catch (error) {
    console.error("GET /api/online-users error:", error);
    return NextResponse.json({ users: [] }, { status: 200 });
  }
}