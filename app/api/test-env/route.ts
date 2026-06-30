// app/api/test-env/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    mongodbUri: process.env.MONGODB_URI ? "✅ Set" : "❌ Not set",
    mongodbDb: process.env.MONGODB_DB || "❌ Not set",
    nextauthUrl: process.env.NEXTAUTH_URL || "❌ Not set",
    googleClientId: process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "❌ Not set",
  });
}