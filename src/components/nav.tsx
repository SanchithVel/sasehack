"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ClipboardList, Globe, HandHeart, LayoutDashboard, MessageCircle, Settings, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const LINKS = [
  { href: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/log", label: "Daily Log", short: "Log", icon: ClipboardList },
  { href: "/prep", label: "Prep Plan", short: "Prep", icon: CalendarClock },
  { href: "/donations", label: "Donations", short: "Donate", icon: HandHeart },
  { href: "/website", label: "Website", short: "Website", icon: Globe },
  { href: "/assistant", label: "Assistant", short: "Ask", icon: MessageCircle },
  { href: "/setup", label: "Setup", short: "Setup", icon: Settings },
];

export function Nav() {
  const path = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r bg-card p-4 md:flex">
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
        <p className="mt-auto text-xs text-muted-foreground">Less waste. More meals. Made for Oklahoma.</p>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-[1000] flex border-t bg-card md:hidden">
        {LINKS.map(({ href, short, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] text-muted-foreground",
              path === href && "text-primary",
            )}
          >
            <Icon className="size-5" />
            {short}
          </Link>
        ))}
      </nav>
    </>
  );
}
