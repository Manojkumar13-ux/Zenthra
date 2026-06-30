// app/admin/layout.tsx
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // ✅ Handle loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ✅ Check if user is admin
  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    redirect("/feed");
  }

  return <>{children}</>;
}