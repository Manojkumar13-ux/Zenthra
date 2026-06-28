// app/(main)/layout.tsx
import { Navbar } from "@/components/shared/navbar";
import { RightSidebar } from "@/components/shared/RightSidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar>
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
          
          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </Navbar>
    </div>
  );
}