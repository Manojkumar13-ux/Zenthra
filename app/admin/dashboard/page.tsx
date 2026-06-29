"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      return res.json();
    },
  });

  if (isLoading) return <p>Loading stats...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold">{data?.totalUsers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Total Posts</p>
          <p className="text-2xl font-bold">{data?.totalPosts}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Reports</p>
          <p className="text-2xl font-bold">{data?.pendingReports}</p>
        </Card>
      </div>
    </div>
  );
}
