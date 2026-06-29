// app/api/upload/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the form data
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // For now, return a placeholder response
    // You'll need to implement actual file upload logic here
    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        name: (file as File).name,
        size: (file as File).size,
        type: (file as File).type,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
