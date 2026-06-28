// app/debug/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function DebugPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/debug/users");
        const data = await response.json();
        console.log("🔍 Debug data:", data);
        setUsers(data.allUsers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchUsers();
    }
  }, [session]);

  if (!session) {
    return <div>Please sign in to view debug info</div>;
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug User Info</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="font-semibold mb-2">Your Session:</h2>
        <pre className="bg-white p-4 rounded text-sm overflow-auto">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <h2 className="font-semibold mb-2">Users in Database:</h2>
      <div className="bg-gray-100 p-4 rounded-lg">
        {users.length === 0 ? (
          <p>No users found in database</p>
        ) : (
          <div className="space-y-2">
            {users.map((user: any) => (
              <div key={user._id} className="bg-white p-3 rounded shadow-sm">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="font-medium">ID:</span>
                  <span className="font-mono">{user._id}</span>
                  <span className="font-medium">Name:</span>
                  <span>{user.name}</span>
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                  <span className="font-medium">Valid ObjectId:</span>
                  <span className={/^[0-9a-fA-F]{24}$/.test(user._id) ? "text-green-600" : "text-red-600"}>
                    {/^[0-9a-fA-F]{24}$/.test(user._id) ? "✅ Yes" : "❌ No"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}