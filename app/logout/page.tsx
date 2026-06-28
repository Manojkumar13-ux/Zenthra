"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies via API
        await fetch("/api/auth/logout", { method: "POST" });
        
        // Sign out
        await signOut({ 
          redirect: false,
        });
        
        // Redirect to login
        window.location.href = "/login";
      } catch (error) {
        console.error("Logout error:", error);
        window.location.href = "/login";
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
        <p className="mt-4 text-gray-600">Logging out...</p>
      </div>
    </div>
  );
}