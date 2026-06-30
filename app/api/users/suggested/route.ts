// app/api/users/suggested/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return mock suggested users (no database needed)
    const mockUsers = [
      { 
        id: "2", 
        name: "Alice Johnson", 
        username: "alicej", 
        image: "", 
        bio: "Tech enthusiast", 
        mutualFollowers: 5 
      },
      { 
        id: "3", 
        name: "Bob Smith", 
        username: "bobsmith", 
        image: "", 
        bio: "Photographer", 
        mutualFollowers: 3 
      },
      { 
        id: "4", 
        name: "Carol White", 
        username: "carolw", 
        image: "", 
        bio: "Travel blogger", 
        mutualFollowers: 7 
      },
    ];

    return NextResponse.json({ users: mockUsers });
  } catch (error) {
    console.error("Error fetching suggested users:", error);
    return NextResponse.json({ users: [] });
  }
}