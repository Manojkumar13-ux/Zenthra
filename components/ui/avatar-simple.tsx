// components/ui/avatar-simple.tsx
import { cn } from "@/lib/utils";

interface AvatarSimpleProps {
  src?: string | null;
  fallback: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function AvatarSimple({
  src,
  fallback,
  alt,
  size = "md",
  className,
}: AvatarSimpleProps) {
  const sizeClasses = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-lg",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 font-semibold text-gray-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-gray-300",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt || fallback}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span className="select-none">{fallback?.charAt(0).toUpperCase() || "U"}</span>
      )}
    </div>
  );
}