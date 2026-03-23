"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Search,
  CalendarDays,
  User,
  Calendar,
  Users,
  Settings,
  LogOut,
  Heart,
  History,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/user-provider";
import { useI18n, LanguageToggle } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { NotificationBell } from "@/components/notifications/notification-bell";

const learnerNav = [
  { href: "/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/teachers", labelKey: "nav.search", icon: Search },
  { href: "/bookings", labelKey: "nav.bookings", icon: CalendarDays },
  { href: "/favorites", labelKey: "nav.favorites", icon: Heart },
  { href: "/history", labelKey: "nav.history", icon: History },
  { href: "/settings", labelKey: "nav.profile", icon: User },
];

const teacherNav = [
  { href: "/teacher/dashboard", labelKey: "nav.home", icon: Home },
  { href: "/teacher/schedule", labelKey: "nav.schedule", icon: Calendar },
  { href: "/teacher/bookings", labelKey: "nav.students", icon: Users },
  { href: "/teacher/profile", labelKey: "nav.profile", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, roles } = useUser();
  const { t } = useI18n();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isTeacher = roles.includes("teacher");
  const navItems = isTeacher ? teacherNav : learnerNav;
  const homeHref = isTeacher ? "/teacher/dashboard" : "/dashboard";

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Desktop top navbar */}
      <header className="hidden md:flex items-center justify-between h-16 px-6 border-b border-border bg-bg-secondary/80 backdrop-blur-xl sticky top-0 z-40">
        <Link
          href={homeHref}
          className="text-xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary"
        >
          Nihon<span className="text-accent">Go</span>
          {isTeacher && (
            <span className="ml-2 text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full align-middle">
              {t("badge.teacher")}
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? isTeacher
                      ? "text-gold bg-gold/10"
                      : "text-accent bg-accent-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
              >
                <item.icon size={16} />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <LanguageToggle />
          {profile && (
            <div className="flex items-center gap-2">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold",
                    isTeacher ? "bg-gold/20 text-gold" : "bg-accent/20 text-accent"
                  )}
                >
                  {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <span className="text-sm text-text-secondary">
                {profile.display_name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Desktop layout with sidebar */}
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-60 min-h-[calc(100vh-4rem)] border-r border-border bg-bg-secondary/50 p-4 gap-1 sticky top-16 h-[calc(100vh-4rem)]">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? isTeacher
                      ? "text-gold bg-gold/10"
                      : "text-accent bg-accent-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
              >
                <item.icon size={18} />
                {t(item.labelKey)}
              </Link>
            );
          })}

          {/* Sidebar footer */}
          <div className="mt-auto pt-4 border-t border-border space-y-2">
            <LanguageToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
            >
              <LogOut size={18} />
              {t("nav.logout")}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-bg-secondary/90 backdrop-blur-xl border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 min-w-[4rem] transition-colors",
                  isActive
                    ? isTeacher
                      ? "text-gold"
                      : "text-accent"
                    : "text-text-muted"
                )}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
