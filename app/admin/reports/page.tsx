"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function AdminReports() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reports");
      return res.json();
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report resolved.");
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Reports</h1>
      {data?.length === 0 ? (
        <p>No reports.</p>
      ) : (
        data?.map((report: any) => (
          <Card key={report._id} className="mb-2 flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{report.reason}</p>
              <p className="text-sm text-gray-500">Reported by: {report.reportedBy?.name}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => resolveMutation.mutate(report._id)}
            >
              Resolve
            </Button>
          </Card>
        ))
      )}
    </div>
  );
}
