// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // FIXED: Import from lib/auth
import { connectDB } from "@/lib/db/connect";
import { Notification } from "@/lib/db/models/Notification"; // FIXED: Import from model

// GET - Fetch notifications with filtering
export async function GET(req: Request) {
  try {
    console.log("🔵 Notifications API: Starting request");

    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("🔴 Notifications API: Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    console.log(`🟢 Notifications API: User ${session.user.id} authenticated`);

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;

    console.log(`📊 Notifications API: Filter: ${filter}, UnreadOnly: ${unreadOnly}`);

    await connectDB();

    // Build query - using the correct field names from your model
    const query: any = { recipient: session.user.id }; // Using 'recipient' not 'user'

    // Apply filter
    if (filter !== "all") {
      const validTypes = ["like", "comment", "mention", "follow", "message", "repost", "community", "achievement"];
      if (!validTypes.includes(filter)) {
        return NextResponse.json(
          { error: "Invalid filter type" },
          { status: 400 }
        );
      }
      query.type = filter;
    }

    if (unreadOnly) {
      query.read = false;
    }

    console.log("🔍 Notifications API: Query:", JSON.stringify(query));

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name username image") // Using 'sender' not 'from'
        .populate("post", "content media")
        .populate("comment", "content")
        .lean(),
      Notification.countDocuments(query),
    ]);

    console.log(`✅ Notifications API: Found ${notifications.length} notifications (total: ${total})`);

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("❌ Notifications API Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: "Server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}

// POST - Create a new notification
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { recipient, type, sender, post, comment, content } = body;

    if (!recipient || !type || !sender) {
      return NextResponse.json(
        { error: "Missing fields", message: "recipient, type, and sender are required" },
        { status: 400 }
      );
    }

    if (recipient === session.user.id) {
      return NextResponse.json(
        { error: "Invalid", message: "Cannot create notification for yourself" },
        { status: 400 }
      );
    }

    const validTypes = ["like", "comment", "mention", "follow", "message", "repost", "community", "achievement"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type", message: `Type must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    await connectDB();

    // Check for duplicate notification (within 5 minutes)
    const existingNotification = await Notification.findOne({
      recipient,
      sender: session.user.id,
      type,
      post: post || null,
      comment: comment || null,
      read: false,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
    });

    if (existingNotification) {
      existingNotification.content = content;
      existingNotification.createdAt = new Date();
      await existingNotification.save();

      const populated = await Notification.findById(existingNotification._id)
        .populate("sender", "name username image")
        .populate("post", "content media")
        .populate("comment", "content")
        .lean();

      return NextResponse.json({
        notification: populated,
        duplicated: true,
      });
    }

    const notification = new Notification({
      recipient,
      sender: session.user.id,
      type,
      content: content || getDefaultMessage(type, session.user.name),
      post: post || null,
      comment: comment || null,
      read: false,
    });

    await notification.save();

    const populated = await Notification.findById(notification._id)
      .populate("sender", "name username image")
      .populate("post", "content media")
      .populate("comment", "content")
      .lean();

    return NextResponse.json({ notification: populated }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Notifications API POST Error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to create notification",
      },
      { status: 500 }
    );
  }
}

// Helper function to get default message
function getDefaultMessage(type: string, senderName: string): string {
  const messages: Record<string, string> = {
    like: `${senderName} liked your post`,
    comment: `${senderName} commented on your post`,
    mention: `${senderName} mentioned you`,
    follow: `${senderName} started following you`,
    message: `${senderName} sent you a message`,
    repost: `${senderName} reposted your post`,
    community: `${senderName} invited you to a community`,
    achievement: `${senderName} unlocked a new achievement`,
  };
  return messages[type] || `${senderName} interacted with you`;
}

// PUT - Update notifications (mark as read)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { notificationId, read, type } = body;

    await connectDB();

    let query: any = { recipient: session.user.id };
    let update: any = {};

    if (notificationId) {
      query._id = notificationId;
      update.read = read !== undefined ? read : true;
    } else if (type) {
      query.type = type;
      update.read = true;
    } else {
      update.read = true;
    }

    if (notificationId) {
      const notification = await Notification.findOneAndUpdate(query, update, {
        new: true,
      })
        .populate("sender", "name username image")
        .populate("post", "content media")
        .populate("comment", "content")
        .lean();

      if (!notification) {
        return NextResponse.json(
          { error: "Not found", message: "Notification not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ notification });
    }

    const result = await Notification.updateMany(query, update);

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    });
  } catch (error: any) {
    console.error("❌ Notifications API PUT Error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to update notifications",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete notifications
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const notificationId = searchParams.get("id");
    const type = searchParams.get("type");
    const deleteAll = searchParams.get("deleteAll") === "true";

    await connectDB();

    let query: any = { recipient: session.user.id };

    if (notificationId) {
      query._id = notificationId;
    } else if (type) {
      const validTypes = ["like", "comment", "mention", "follow", "message", "repost", "community", "achievement"];
      if (!validTypes.includes(type)) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
      query.type = type;
    } else if (!deleteAll) {
      return NextResponse.json(
        { error: "Missing parameters", message: "Provide id, type, or deleteAll=true" },
        { status: 400 }
      );
    }

    const result = await Notification.deleteMany(query);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("❌ Notifications API DELETE Error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to delete notifications",
      },
      { status: 500 }
    );
  }
}