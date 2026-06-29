// components/ui/avatar-simple.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AvatarSimpleProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}

export function AvatarSimple({
  src,
  alt,
  fallback,
  className,
  size = "md",
  onClick,
}: AvatarSimpleProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-rose-500",
    "bg-violet-500",
  ];

  const colorIndex = (fallback || alt || "?").charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        "relative flex-shrink-0 cursor-pointer overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}
      onClick={onClick}
    >
      {src && !hasError && (
        <img
          src={src}
          alt={alt || "Avatar"}
          onError={() => setHasError(true)}
          onLoad={() => setIsLoaded(true)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
        />
      )}

      {(!src || hasError) && (
        <div
          className={cn(
            "flex h-full w-full select-none items-center justify-center font-semibold text-white",
            colors[colorIndex]
          )}
        >
          {getInitials(fallback || alt || "User")}
        </div>
      )}
    </div>
  );
}
