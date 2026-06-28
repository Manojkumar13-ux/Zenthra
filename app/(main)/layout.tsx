// app/(main)/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import Providers from "@/components/Providers";
import Sidebar from "@/components/shared/Sidebar";
import RightSidebar from "@/components/shared/RightSidebar";
import Navbar from "@/components/shared/Navbar";
import MobileNavbar from "@/components/shared/MobileNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Zenthra",
  description: "Your social media platform",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-16 lg:pb-0">
        <Navbar />
        <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
          <aside className="hidden lg:block lg:w-64 flex-shrink-0">
            <div className="sticky top-20">
              <Sidebar />
            </div>
          </aside>
          <main className="flex-1 min-w-0 max-w-3xl">
            {children}
          </main>
          <aside className="hidden xl:block xl:w-80 flex-shrink-0">
            <div className="sticky top-20">
              <RightSidebar />
            </div>
          </aside>
        </div>
        <MobileNavbar />
      </div>
    </Providers>
  );
}