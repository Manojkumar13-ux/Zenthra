export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// app/api/test/db-users/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await connectToDatabase();
    const users = db.collection("users");
    
    // Get ALL users
    const allUsers = await users.find().toArray();
    
    console.log("📊 Total users in DB:", allUsers.length);
    allUsers.forEach(u => {
      console.log(`  - ${u.name} (@${u.username}) [${u._id}]`);
    });
    
    return NextResponse.json({
      total: allUsers.length,
      users: allUsers.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        username: u.username,
        email: u.email,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}