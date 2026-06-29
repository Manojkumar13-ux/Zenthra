// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

import { User } from "@/lib/db/models/User";

import crypto from "crypto";


export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: "If an account exists, you will receive a password reset email.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // Send email (mock for now - implement with actual email service)
    console.log(
      `Password reset link: https://zenthra.vercel.app/reset-password?token=${resetToken}`
    );

    return NextResponse.json({
      message: "If an account exists, you will receive a password reset email.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
