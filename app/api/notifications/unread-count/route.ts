// app/api/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
// import prisma from "@/lib/prisma"; // or your database client

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count unread notifications for the current user
    // Using Prisma example:
    // const count = await prisma.notification.count({
    //   where: {
    //     userId: session.user.id,
    //     read: false,
    //   },
    // });

    // Using Mongoose example:
    // const count = await Notification.countDocuments({
    //   userId: session.user.id,
    //   read: false,
    // });

    // For now, return a mock count if database is not set up
    const count = 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}