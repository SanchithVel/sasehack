"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, CalendarClock, HandHeart, LayoutDashboard, MessageCircle, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, BUSINESS } from "@/lib/data/business";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/log", label: "Log Waste", icon: Camera },
  { href: "/prep", label: "Prep", icon: CalendarClock },
  { href: "/surplus", label: "Surplus", icon: HandHeart },
  { href: "/assistant", label: "Assistant", icon: MessageCircle },
];

export function Nav() {
  const path = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-background p-4 md:flex">
        <div className="mb-8 flex items-center gap-2 font-semibold">
          <Sprout className="size-6 text-primary" />
          {APP_NAME}
        </div>
        <nav className="flex flex-col gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted",
                path === href && "bg-primary/10 font-medium text-primary",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-xs text-muted-foreground">
          {BUSINESS.name}
          <br />
          {BUSINESS.city}
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-[1000] flex border-t bg-background md:hidden">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground",
              path === href && "text-primary",
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
