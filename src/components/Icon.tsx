"use client";

interface IconProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  filled?: boolean;
}

export function Icon({ name, className = "", size = "md", filled = false }: IconProps) {
  const sizeClasses = {
    sm: "text-base", // 16px
    md: "text-lg",  // 18px
    lg: "text-xl",  // 20px
    xl: "text-2xl", // 24px
  };

  return (
    <span
      className={`material-symbols-outlined select-none ${sizeClasses[size]} ${className}`}
      style={{
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
      }}
    >
      {name}
    </span>
  );
}