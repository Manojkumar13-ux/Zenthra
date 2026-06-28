import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import crypto from "crypto";
import { sendEmail } from "@/lib/utils/email"; // imaginary email utility

export async function POST(req: Request) {
  const { email } = await req.json();
  await connectDB();
  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  const token = crypto.randomBytes(32).toString("hex");
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();
  // Send email (implement sendEmail)
  await sendEmail({
    to: email,
    subject: "Reset Password",
    html: `<a href="${process.env.NEXTAUTH_URL}/reset-password?token=${token}">Reset Password</a>`,
  });
  return NextResponse.json({ message: "Email sent" });
}