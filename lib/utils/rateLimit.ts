import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  perUser?: boolean;
}

export async function checkRateLimit(userId: string, action: string, options: RateLimitOptions) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const now = new Date();
  const windowStart = new Date(now.getTime() - options.windowMs);

  // Initialize rate limit tracking if not exists
  if (!user.rateLimits) {
    user.rateLimits = {};
  }

  const userLimits = user.rateLimits[action] || { requests: [], resetAt: null };

  // Check if we need to reset the window
  if (userLimits.resetAt && new Date(userLimits.resetAt) < now) {
    userLimits.requests = [];
    userLimits.resetAt = null;
  }

  // Clean old requests
  userLimits.requests = userLimits.requests.filter(
    (timestamp: Date) => new Date(timestamp) > windowStart
  );

  // Check if limit exceeded
  if (userLimits.requests.length >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(userLimits.requests[0]?.getTime() + options.windowMs),
      requests: userLimits.requests.length,
      limit: options.maxRequests,
    };
  }

  // Add new request
  userLimits.requests.push(new Date());
  if (!userLimits.resetAt) {
    userLimits.resetAt = new Date(now.getTime() + options.windowMs);
  }

  await User.findByIdAndUpdate(userId, {
    $set: { [`rateLimits.${action}`]: userLimits },
  });

  return {
    allowed: true,
    remaining: options.maxRequests - userLimits.requests.length,
    resetAt: userLimits.resetAt,
    requests: userLimits.requests.length,
    limit: options.maxRequests,
  };
}
