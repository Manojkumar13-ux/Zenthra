"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.clear();

      // Clear session storage
      sessionStorage.clear();

      // Sign out with redirect to login
      await signOut({
        redirect: true,
        callbackUrl: "/login",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="flex items-center gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  );
}
