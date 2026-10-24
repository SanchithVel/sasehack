import { cn } from "@/lib/utils";

/** A labeled form field. */
export function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

/** Native select styled to match the shadcn Input. */
export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}
