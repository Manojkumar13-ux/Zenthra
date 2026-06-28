"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  if (session?.user?.role !== "admin") {
    redirect("/feed");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 dark:bg-gray-800 p-4 space-y-2">
        <h1 className="text-xl font-bold">Admin</h1>
        <nav className="flex flex-col gap-1">
          <Link href="/admin/dashboard" className="hover:bg-gray-200 p-2 rounded">Dashboard</Link>
          <Link href="/admin/users" className="hover:bg-gray-200 p-2 rounded">Users</Link>
          <Link href="/admin/reports" className="hover:bg-gray-200 p-2 rounded">Reports</Link>
          <Link href="/admin/moderation" className="hover:bg-gray-200 p-2 rounded">Moderation</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}