// src/app/admin/dashboard/page.tsx
// Admin Hub — stats, user management, hard words

export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { cn }     from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Hub — 4,000 Essential Words" };
export const revalidate = 30;

async function getAdminStats() {
  const [totalUsers, totalWords, totalBatches, hardWords, recentUsers, allUsers] = await Promise.all([
    prisma.user.count(),
    prisma.word.count(),
    prisma.importBatch.count({ where: { status: "done" } }),
    // Most difficult words: highest wrong rate (timesWrong / timesSeen)
    prisma.userWordMastery.groupBy({
      by: ["wordId"],
      _avg: { timesWrong: true, timesSeen: true, masteryLevel: true },
      having: { timesSeen: { _avg: { gt: 2 } } },
      orderBy: { _avg: { timesWrong: "desc" } },
      take: 8,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, username: true, email: true, role: true, createdAt: true,
        leaderboard: { select: { totalXp: true, streakDays: true } },
        _count: { select: { wordMastery: true } },
      },
    }),
  ]);

  // Resolve word details for hard words
  const hardWordDetails = await Promise.all(
    hardWords.map(async (hw) => {
      const w = await prisma.word.findUnique({ where: { id: hw.wordId }, select: { word: true, type: true, unit: { select: { number: true, level: { select: { number: true } } } } } });
      return { ...hw, details: w };
    })
  );

  // XP totals
  const totalXp = await prisma.leaderboardSnapshot.aggregate({ _sum: { totalXp: true } });

  // Daily active (studied in last 7 days)
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const activeUsers = await prisma.xpEvent.groupBy({ by: ["userId"], where: { createdAt: { gte: weekAgo } } });

  return { totalUsers, totalWords, totalBatches, hardWordDetails, recentUsers, allUsers, totalXp: totalXp._sum.totalXp ?? 0, activeThisWeek: activeUsers.length };
}

function StatCard({ label, value, icon, sub, accent = false }: { label: string; value: string | number; icon: string; sub?: string; accent?: boolean }) {
  return (
    <div className={cn("glass rounded-2xl p-6 border flex flex-col gap-3", accent ? "border-primary/30 bg-primary/5" : "border-border/50")}>
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-3xl font-bold text-foreground">{typeof value === "number" ? value.toLocaleString() : value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const s = await getAdminStats();

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow" />
            <span className="text-xs text-emerald-400 font-medium">Admin Hub</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Overlord Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Full system oversight and control</p>
        </div>
        <div className="flex gap-2">
          <a href="/admin/upload" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
            📤 Import Words
          </a>
          <a href="/admin/words" className="inline-flex items-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors">
            ✏️ Manage Words
          </a>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard accent label="Total Users"      value={s.totalUsers}      icon="👥" sub={`${s.activeThisWeek} active this week`} />
        <StatCard label="Total Words"             value={s.totalWords}      icon="📚" sub={`${s.totalBatches} import batches`} />
        <StatCard label="Total XP Earned"         value={s.totalXp}         icon="⚡" sub="across all users" />
        <StatCard label="Active This Week"        value={s.activeThisWeek}  icon="🔥" sub="unique learners" />
      </div>

      {/* Hard words */}
      {s.hardWordDetails.length > 0 && (
        <div className="glass rounded-2xl border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50 flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <h2 className="font-bold text-foreground">Most Difficult Words</h2>
            <span className="text-xs text-muted-foreground ml-1">— based on SRS error rates</span>
          </div>
          <div className="divide-y divide-border/30">
            {s.hardWordDetails.map((hw) => {
              const wrongRate = hw._avg.timesWrong ?? 0;
              const pct = Math.min(Math.round((wrongRate / Math.max(hw._avg.timesSeen ?? 1, 1)) * 100), 100);
              return (
                <div key={hw.wordId} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{hw.details?.word ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      L{hw.details?.unit?.level?.number} · U{hw.details?.unit?.number} · {hw.details?.type}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-rose-400 w-12 text-right">{pct}% miss</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User management */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <h2 className="font-bold text-foreground">All Users</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md font-mono">{s.allUsers.length}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Email</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">XP</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Words</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Streak</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {s.allUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <a href={`/profile/${u.username}`} className="font-semibold text-foreground hover:text-primary transition-colors">{u.username}</a>
                        <p className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-400">⚡ {(u.leaderboard?.totalXp ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-foreground hidden md:table-cell">{u._count.wordMastery}</td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    {(u.leaderboard?.streakDays ?? 0) > 0
                      ? <span className="text-orange-400">🔥 {u.leaderboard?.streakDays}d</span>
                      : <span className="text-muted-foreground/40">—</span>}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full border font-medium",
                      u.role === "admin" ? "bg-primary/20 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border/50")}>
                      {u.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
