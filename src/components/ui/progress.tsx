import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;   // 0–100
  label?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, label, ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: "linear-gradient(90deg, #6366f1, #818cf8)",
          boxShadow:  "0 0 12px rgba(99,102,241,0.6)",
        }}
      />
      {label && (
        <span className="absolute right-0 top-3 text-xs text-muted-foreground">
          {label}
        </span>
      )}
    </div>
  )
);
Progress.displayName = "Progress";

export { Progress };
