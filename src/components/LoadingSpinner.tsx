"use client";

import { Icon } from "./Icon";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  message = "読み込み中...",
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex items-center space-x-3 text-gray-400">
        <div
          className={`${sizeClasses[size]} border-2 border-gray-600 border-t-indigo-600 rounded-full animate-spin`}
        />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

export function FullPageLoader({
  message = "Linearからデータを読み込んでいます...",
}) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex items-center justify-center">
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}

export function InlineLoader({ message = "読み込み中..." }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="md" message={message} />
    </div>
  );
}
