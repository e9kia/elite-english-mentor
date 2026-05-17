// src/app/(student)/layout.tsx
// Student-facing shell — Elite Midnight Gold + mobile bottom nav
// Designed by Ali Jitam ❤️

import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";
import Link from "next/link";
import HeartbeatPing from "./HeartbeatPing";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Heartbeat: silently updates lastSeen every 2 minutes */}
      {session?.user && <HeartbeatPing />}

      {/* ═══ PREMIUM NAV ═══ */}
      <header className="sticky top-0 z-50 elite-card border-b border-gold/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-br from-primary/20 to-gold/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-black text-foreground leading-none tracking-tight">Elite English <span className="text-primary">Mentor</span></p>
              <p className="text-[9px] text-gold/50 leading-none mt-0.5 font-bold tracking-widest uppercase hidden sm:block">4,000 Words</p>
            </div>
          </Link>

          {/* Desktop Nav — hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: "Dashboard",   href: "/dashboard",    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
              { label: "Compete",     href: "/compete",      icon: "M13 10V3L4 14h7v7l9-11h-7z" },
              { label: "Leaderboard", href: "/leaderboard",  icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
              { label: "Teams",       href: "/teams",        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <div className="h-6 w-px bg-border/30 mx-1 hidden sm:block" />
            <UserMenu />
            {session?.user?.role === 'admin' && (
              <Link href="/admin/dashboard"
                className="text-xs font-bold text-gold/60 hover:text-gold transition-colors hidden sm:block">
                Admin ↗
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 min-h-[calc(100vh-160px)]">{children}</main>

      {/* ═══ ELITE FOOTER — Desktop Only ═══ */}
      <footer className="hidden lg:block border-t border-gold/5 py-12 elite-card">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-center gap-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-12 bg-gold/20" />
            <p className="text-sm font-bold text-foreground">
              Designed & Developed by <span className="text-gold font-black">Ali Jitam ❤️</span>
            </p>
            <span className="h-px w-12 bg-gold/20" />
          </div>
          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">
            © 2026 Elite English Mentor
          </p>
        </div>
      </footer>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden elite-card border-t border-gold/10 pb-safe">
        <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
          {[
            { label: "Home",        href: "/dashboard",   icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { label: "Compete",     href: "/compete",     icon: "M13 10V3L4 14h7v7l9-11h-7z" },
            { label: "Ranks",       href: "/leaderboard", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
            { label: "Profile",     href: "/profile",     icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted-foreground hover:text-primary transition-colors tap-target">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              <span className="text-[9px] font-bold uppercase tracking-wider">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
