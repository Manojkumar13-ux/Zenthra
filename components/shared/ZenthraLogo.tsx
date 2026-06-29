"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

interface ZenthraLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function ZenthraLogo({ size = "md", showText = true, className = "" }: ZenthraLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [styleIndex, setStyleIndex] = useState(0);

  const sizes = {
    sm: { icon: 28, text: "text-lg" },
    md: { icon: 32, text: "text-2xl" },
    lg: { icon: 40, text: "text-3xl" },
  };

  // Different gradient styles
  const gradients = [
    {
      id: 0,
      colors: ["#6366F1", "#8B5CF6"],
      name: "Indigo Purple",
    },
    {
      id: 1,
      colors: ["#EC4899", "#F59E0B"],
      name: "Pink Orange",
    },
    {
      id: 2,
      colors: ["#06B6D4", "#10B981"],
      name: "Cyan Green",
    },
    {
      id: 3,
      colors: ["#F472B6", "#8B5CF6"],
      name: "Pink Purple",
    },
    {
      id: 4,
      colors: ["#F59E0B", "#EF4444"],
      name: "Orange Red",
    },
    {
      id: 5,
      colors: ["#3B82F6", "#06B6D4"],
      name: "Blue Cyan",
    },
    {
      id: 6,
      colors: ["#EC4899", "#06B6D4"],
      name: "Pink Cyan",
    },
    {
      id: 7,
      colors: ["#8B5CF6", "#F472B6"],
      name: "Purple Pink",
    },
  ];

  // Different font styles
  const fontStyles = [
    { family: "Arial, sans-serif", weight: 700 },
    { family: "Georgia, serif", weight: 700 },
    { family: "'Courier New', monospace", weight: 700 },
    { family: "'Times New Roman', serif", weight: 700 },
    { family: "Verdana, sans-serif", weight: 700 },
    { family: "'Trebuchet MS', sans-serif", weight: 700 },
    { family: "Impact, sans-serif", weight: 700 },
    { family: "'Comic Sans MS', cursive", weight: 700 },
    { family: "Georgia, serif", weight: 400 },
    { family: "Arial Black, sans-serif", weight: 900 },
  ];

  // Different avatar/icon styles
  const avatarStyles = [
    { shape: "circle", border: "none" },
    { shape: "square", border: "4px solid" },
    { shape: "hexagon", border: "none" },
    { shape: "circle", border: "2px dashed" },
    { shape: "square", border: "2px dotted" },
    { shape: "circle", border: "3px double" },
    { shape: "rounded", border: "none" },
    { shape: "circle", border: "4px dotted" },
  ];

  const currentGradient = gradients[styleIndex % gradients.length];
  const currentFont = fontStyles[styleIndex % fontStyles.length];
  const currentAvatar = avatarStyles[styleIndex % avatarStyles.length];

  const handleHoverStart = () => {
    setIsHovered(true);
    setStyleIndex((prev) => (prev + 1) % gradients.length);
  };

  const handleHoverEnd = () => {
    setIsHovered(false);
  };

  // Sparkle animation variants
  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: [0, 1, 0],
      scale: [0.5, 1.2, 0.5],
      transition: { duration: 0.8, repeat: Infinity },
    },
  };

  return (
    <Link
      href="/feed"
      className={`flex items-center gap-2 ${className}`}
      onMouseEnter={handleHoverStart}
      onMouseLeave={handleHoverEnd}
    >
      <motion.div
        className="relative flex-shrink-0"
        animate={{
          scale: isHovered ? 1.1 : 1,
          rotate: isHovered ? [0, -5, 5, -5, 0] : 0,
        }}
        transition={{
          duration: 0.5,
          scale: { type: "spring", stiffness: 300, damping: 20 },
          rotate: { duration: 0.5, repeat: isHovered ? 1 : 0 },
        }}
      >
        {/* Main Logo SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          className="flex-shrink-0"
          style={{
            width: sizes[size].icon,
            height: sizes[size].icon,
          }}
        >
          <defs>
            <linearGradient id={`grad-${styleIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: currentGradient.colors[0] }} />
              <stop offset="100%" style={{ stopColor: currentGradient.colors[1] }} />
            </linearGradient>

            {/* Glow filter */}
            <filter id={`glow-${styleIndex}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background shape with avatar style */}
          {currentAvatar.shape === "circle" && (
            <circle
              cx="50"
              cy="50"
              r="45"
              fill={`url(#grad-${styleIndex})`}
              stroke={isHovered ? currentGradient.colors[1] : "none"}
              strokeWidth={currentAvatar.border ? "2" : "0"}
              strokeDasharray={currentAvatar.border.includes("dash") ? "5,5" : "none"}
            />
          )}

          {currentAvatar.shape === "square" && (
            <rect
              x="5"
              y="5"
              width="90"
              height="90"
              rx="8"
              fill={`url(#grad-${styleIndex})`}
              stroke={isHovered ? currentGradient.colors[1] : "none"}
              strokeWidth={currentAvatar.border ? "2" : "0"}
              strokeDasharray={currentAvatar.border.includes("dash") ? "5,5" : "none"}
            />
          )}

          {currentAvatar.shape === "rounded" && (
            <rect x="5" y="5" width="90" height="90" rx="20" fill={`url(#grad-${styleIndex})`} />
          )}

          {currentAvatar.shape === "hexagon" && (
            <polygon
              points="50 5, 90 27, 90 73, 50 95, 10 73, 10 27"
              fill={`url(#grad-${styleIndex})`}
            />
          )}

          {/* Glow effect on hover */}
          {isHovered && (
            <circle
              cx="50"
              cy="50"
              r="50"
              fill="none"
              stroke={`url(#grad-${styleIndex})`}
              strokeWidth="2"
              opacity="0.5"
              filter={`url(#glow-${styleIndex})`}
            />
          )}

          {/* Z letter with dynamic font */}
          <text
            x="50"
            y="68"
            fontSize="48"
            textAnchor="middle"
            fill="white"
            fontFamily={currentFont.family}
            fontWeight={currentFont.weight}
            style={{
              textShadow: isHovered ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
            }}
          >
            Z
          </text>

          {/* Sparkle/Star with animation */}
          <motion.g animate={isHovered ? "visible" : "hidden"} variants={sparkleVariants}>
            <path
              d="M72 22 L78 16 M75 14 L75 24 M68 19 L82 19"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </motion.g>

          {/* Additional sparkle dots */}
          <circle cx="28" cy="22" r="2.5" fill="white" opacity={isHovered ? 1 : 0.6}>
            <animate
              attributeName="opacity"
              values={isHovered ? "0.3;1;0.3" : "0.5"}
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="82" cy="35" r="2" fill="white" opacity={isHovered ? 1 : 0.4}>
            <animate
              attributeName="opacity"
              values={isHovered ? "0.3;1;0.3" : "0.4"}
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>

        {/* Hover indicator - small pulse ring */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            style={{
              border: `2px solid ${currentGradient.colors[0]}`,
              borderRadius: "50%",
            }}
          />
        )}
      </motion.div>

      {showText && (
        <motion.span
          className={`font-bold text-indigo-600 dark:text-indigo-400 ${sizes[size].text}`}
          animate={{
            color: isHovered ? currentGradient.colors[0] : undefined,
            scale: isHovered ? 1.05 : 1,
            x: isHovered ? 5 : 0,
          }}
          transition={{
            duration: 0.3,
            color: { duration: 0.5 },
          }}
          style={{
            fontFamily: currentFont.family,
            fontWeight: currentFont.weight,
            textShadow: isHovered ? `0 4px 20px ${currentGradient.colors[0]}40` : "none",
          }}
        >
          Zenthra
        </motion.span>
      )}
    </Link>
  );
}
