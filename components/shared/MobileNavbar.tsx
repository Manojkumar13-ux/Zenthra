// components/shared/MobileNavbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bell, Mail, User, PlusCircle } from "lucide-react";

export default function MobileNavbar() {
  const pathname = usePathname();

  const items = [
    { icon: Home, label: "Home", href: "/feed" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: PlusCircle, label: "Post", href: "/feed" },
    { icon: Bell, label: "Notifications", href: "/notifications" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:border-gray-700 dark:bg-gray-900 lg:hidden">
      <div className="flex h-16 items-center justify-around px-4">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <item.icon
                className={`h-5 w-5 ${isActive ? "fill-blue-600 dark:fill-blue-400" : ""}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
