// app/api/test/create-real-users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

// ✅ Add this to fix dynamic server usage
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = await connectToDatabase();
    const users = db.collection("users");

    // Check existing users
    const existingCount = await users.countDocuments();
    console.log("📊 Existing users:", existingCount);

    if (existingCount > 5) {
      return NextResponse.json({
        message: `✅ ${existingCount} users already exist in database`,
        users: await users.find().limit(10).toArray(),
      });
    }

    // Sample users
    const sampleUsers = [
      {
        name: "Alice Johnson",
        username: "alicej",
        email: "alice@example.com",
        password: await bcrypt.hash("password123", 10),
        image: "https://ui-avatars.com/api/?name=Alice+Johnson&background=6366f1&color=fff&size=128",
        bio: "Tech enthusiast | React Developer",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // ... other users
    ];

    // ✅ Try to insert, skip duplicates
    let insertedCount = 0;
    for (const user of sampleUsers) {
      try {
        // Check if user already exists
        const existing = await users.findOne({ 
          $or: [
            { email: user.email },
            { username: user.username }
          ]
        });
        
        if (!existing) {
          await users.insertOne(user);
          insertedCount++;
        } else {
          console.log(`⏭️ Skipping existing user: ${user.name} (${user.email})`);
        }
      } catch (error) {
        console.error(`Failed to insert ${user.name}:`, error);
      }
    }

    // ✅ Return success with inserted count
    return NextResponse.json({
      message: `✅ Added ${insertedCount} new users! ${existingCount > 0 ? `(${existingCount} users already existed)` : ''}`,
      insertedCount,
      totalUsers: await users.countDocuments(),
      sampleUsers: sampleUsers.map(u => ({
        name: u.name,
        username: u.username,
        email: u.email,
        password: "password123",
      })),
    });
  } catch (error) {
    console.error("Error creating users:", error);
    return NextResponse.json(
      { error: "Failed to create users" },
      { status: 500 }
    );
  }
}