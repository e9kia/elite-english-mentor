import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold font-mono tracking-wide transition-colors",
  {
    variants: {
      variant: {
        // Word type badges
        noun:       "border-blue-500/30   bg-blue-500/10   text-blue-300",
        verb:       "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        adjective:  "border-violet-500/30 bg-violet-500/10  text-violet-300",
        adverb:     "border-amber-500/30  bg-amber-500/10   text-amber-300",
        phrase:     "border-pink-500/30   bg-pink-500/10    text-pink-300",
        other:      "border-slate-500/30  bg-slate-500/10   text-slate-300",
        // Status badges
        success:    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        error:      "border-rose-500/30   bg-rose-500/10    text-rose-300",
        warning:    "border-amber-500/30  bg-amber-500/10   text-amber-300",
        info:       "border-indigo-500/30 bg-indigo-500/10  text-indigo-300",
        default:    "border-border        bg-muted          text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
