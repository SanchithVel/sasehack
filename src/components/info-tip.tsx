import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A small (i) icon that reveals extra explanation on hover or tap/focus,
 * so pages can stay short.
 */
export function InfoTip({
  children,
  align = "center",
  className,
}: {
  children: React.ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}) {
  return (
    <span className={cn("group relative inline-flex align-middle", className)}>
      <button
        type="button"
        aria-label="More info"
        className="rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
      >
        <Info className="size-4" />
      </button>
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none invisible absolute top-full z-50 mt-2 w-64 rounded-lg border bg-popover p-3 text-xs leading-relaxed font-normal text-popover-foreground opacity-0 shadow-xl transition-opacity",
          "group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100",
          align === "start" && "left-0",
          align === "center" && "left-1/2 -translate-x-1/2",
          align === "end" && "right-0",
        )}
      >
        {children}
      </span>
    </span>
  );
}
