// app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // ✅ Validate before querying
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "Invalid notification ID format" },
        { status: 400 }
      );
    }

    // Your existing logic to fetch a single notification by id
    // const notification = await Notification.findById(id);
    return NextResponse.json({ notification: null });
  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}