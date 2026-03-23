"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, GraduationCap, Users, CalendarDays, Mail } from "lucide-react";

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/invites", label: "Invites", icon: Mail },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-56 flex-col border-r border-border bg-bg-secondary/50 p-4 gap-1 z-30">
        <div className="mb-4 px-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            Admin
          </span>
        </div>
        {adminNavItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "text-accent bg-accent-subtle"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </aside>

      {/* Mobile top tabs */}
      <div className="md:hidden sticky top-0 z-30 bg-bg-secondary/90 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto">
          {adminNavItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "text-accent bg-accent-subtle"
                    : "text-text-secondary hover:text-text-primary"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Spacer for desktop sidebar */}
      <div className="hidden md:block w-56 flex-shrink-0" />
    </>
  );
}
