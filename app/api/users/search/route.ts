// app/api/users/search/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
import { User } from "@/lib/db/models/User";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!q) {
      return NextResponse.json({ users: [] });
    }

    await connectDB();

    const users = await User.find({
      $or: [{ name: { $regex: q, $options: "i" } }, { username: { $regex: q, $options: "i" } }],
      _id: { $ne: session.user.id },
    })
      .select("_id name username image bio")
      .limit(limit)
      .lean();

    const formattedUsers = users.map((user: any) => ({
      ...user,
      _id: user._id.toString(),
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
