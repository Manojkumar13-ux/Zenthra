// app/api/notifications/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
// Import models to ensure they're registered
import "@/lib/db/models";

export const dynamic = 'force-dynamic';

// Mock data for fallback (keep this for when DB fails)
const mockNotifications = [
  {
    _id: "1",
    type: "like",
    content: "John Doe liked your post",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    sender: {
      _id: "user1",
      name: "John Doe",
      username: "johndoe",
      image: null,
    },
    post: {
      _id: "post1",
      content: "Sample post content",
    },
  },
  // ... other mock notifications
];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const filter = searchParams.get("filter") || "all";

    try {
      await connectDB();

      // Dynamically import models to ensure they're loaded
      const { Notification } = await import("@/lib/db/models/Notification");
      const { User } = await import("@/lib/db/models/User");
      const { Post } = await import("@/lib/db/models/Post");
      const { Comment } = await import("@/lib/db/models/Comment");

      const query: any = { recipient: session.user.id };

      if (filter !== "all") {
        const validTypes = [
          "like",
          "comment",
          "mention",
          "follow",
          "message",
          "repost",
          "community",
          "achievement",
        ];
        if (validTypes.includes(filter)) {
          query.type = filter;
        }
      }

      // Use .lean() to avoid Mongoose document issues
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("sender", "name username image")
        .populate("post", "content media")
        .populate("comment", "content")
        .lean();

      const unreadCount = await Notification.countDocuments({
        ...query,
        read: false,
      });

      return NextResponse.json({
        notifications: notifications || [],
        unreadCount: unreadCount || 0,
      });
    } catch (dbError: any) {
      console.error("Database error, using mock data:", dbError.message);

      // Fallback to mock data
      const filteredMock =
        filter !== "all" ? mockNotifications.filter((n) => n.type === filter) : mockNotifications;

      const limitedMock = filteredMock.slice(0, limit);
      const unreadCount = limitedMock.filter((n: any) => !n.read).length;

      return NextResponse.json({
        notifications: limitedMock,
        unreadCount,
        usingMockData: true,
      });
    }
  } catch (error: any) {
    console.error("Notifications API Error:", error.message);

    return NextResponse.json({
      notifications: mockNotifications.slice(0, 5),
      unreadCount: mockNotifications.filter((n: any) => !n.read).length,
      usingMockData: true,
    });
  }
}

// ... POST, PUT, DELETE handlers remain the same
