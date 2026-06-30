// app/api/test/check-users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection("users");
    
    // Get all users
    const users = await usersCollection.find().toArray();
    
    console.log("📊 Total users in database:", users.length);
    
    return NextResponse.json({
      totalUsers: users.length,
      users: users.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        username: u.username,
        email: u.email,
      })),
    });
  } catch (error) {
    console.error("Error checking users:", error);
    return NextResponse.json({ error: "Failed to check users" }, { status: 500 });
  }
}