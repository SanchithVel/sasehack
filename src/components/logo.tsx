import { cn } from "@/lib/utils";

/** The PlateShare mark: a plate with a sprout. Same drawing as public/logo-mark.svg, in currentColor. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("text-primary", className)}>
      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="32" cy="32" r="19" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.45" />
      <path d="M32 45 V30" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 36 C24.5 36 20 31 20 24.5 C27 24.5 32 29 32 36 Z" fill="currentColor" />
      <path d="M32 31 C32 23 37 18.5 45 18.5 C45 26.5 40 31 32 31 Z" fill="currentColor" />
    </svg>
  );
}
