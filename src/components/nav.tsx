"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, ClipboardList, HandHeart, LayoutDashboard, MessageCircle, Settings } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/log", label: "Daily Log", short: "Log", icon: ClipboardList },
  { href: "/prep", label: "Prep Plan", short: "Prep", icon: CalendarClock },
  { href: "/donations", label: "Donations", short: "Donate", icon: HandHeart },
  { href: "/assistant", label: "Assistant", short: "Ask", icon: MessageCircle },
];
const SETUP = { href: "/setup", label: "Setup", short: "Setup", icon: Settings };

function NavLink({ href, label, icon: Icon, active }: (typeof LINKS)[number] & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-foreground",
        active && "bg-white/[0.06] font-medium text-foreground",
      )}
    >
      <Icon className={cn("size-5", active && "text-primary")} />
      {label}
    </Link>
  );
}

export function Nav() {
  const path = usePathname();
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.05] px-4 py-8 md:flex">
        <div className="mb-10 flex items-center gap-2.5 px-3 text-lg font-semibold tracking-tight">
          <LogoMark className="size-8" />
          <span>
            Plate<span className="text-primary">Share</span>
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.href} {...l} active={path === l.href} />
          ))}
        </nav>
        <div className="mt-auto">
          <NavLink {...SETUP} active={path === SETUP.href} />
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-[1000] flex border-t border-white/[0.06] bg-background/95 backdrop-blur md:hidden">
        {[...LINKS, SETUP].map(({ href, short, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn("flex flex-1 flex-col items-center gap-1 py-3 text-xs text-muted-foreground", path === href && "text-primary")}
          >
            <Icon className="size-5" />
            {short}
          </Link>
        ))}
      </nav>
    </>
  );
}
