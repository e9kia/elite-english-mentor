// src/app/(student)/profile/[username]/page.tsx
export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { prisma }   from "@/lib/prisma";
import { cn }       from "@/lib/utils";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function generateMetadata({ params }: { params: { username: string } }): Promise<Metadata> {
  return { title: `${params.username}'s Profile — 4,000 Essential Words` };
}

function StatCard({ label, value, icon, color = "text-foreground" }: {
  label: string; value: string | number; icon: string; color?: string;
}) {
  return (
    <div className="glass rounded-2xl border border-border/50 p-5 flex flex-col gap-2">
      <span className="text-2xl">{icon}</span>
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityGrid({ days }: { days: { date: string; xp: number }[] }) {
  const max = Math.max(...days.map((d) => d.xp), 1);
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">30-Day Activity</p>
      <div className="flex gap-1 flex-wrap">
        {days.map((d, i) => (
          <div key={i} title={`${d.date}: ${d.xp} XP`}
            className="h-5 w-5 rounded-sm bg-primary transition-colors"
            style={{ opacity: d.xp === 0 ? 0.1 : 0.25 + (d.xp / max) * 0.75 }} />
        ))}
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true, username: true, createdAt: true, role: true,
      leaderboard: true,
      userBadges: { include: { badge: true }, orderBy: { earnedAt: "asc" } },
      wordMastery: { select: { masteryLevel: true } },
    },
  });
  if (!user) notFound();

  const session = await getServerSession(authOptions);
  const isOwnProfile = session?.user?.id === user.id;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const xpEvents = await prisma.xpEvent.groupBy({
    by: ["createdAt"],
    _sum: { xpEarned: true },
    where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
  });

  const dayMap: Record<string, number> = {};
  xpEvents.forEach((e) => {
    const key = new Date(e.createdAt).toDateString();
    dayMap[key] = (dayMap[key] ?? 0) + (e._sum.xpEarned ?? 0);
  });

  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    return { date: d.toDateString(), xp: dayMap[d.toDateString()] ?? 0 };
  });

  const xp      = user.leaderboard?.totalXp ?? 0;
  const streak  = user.leaderboard?.streakDays ?? 0;
  const mastered = user.wordMastery.filter((w) => w.masteryLevel >= 3).length;
  const familiar = user.wordMastery.filter((w) => w.masteryLevel === 2).length;
  const learning = user.wordMastery.filter((w) => w.masteryLevel === 1).length;
  const total    = user.wordMastery.length;

  const BADGE_EMOJI: Record<string, string> = { "First Word": "🌱", "Word Explorer": "🗺️", "Vocabulary Master": "👑", default: "🏅" };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass rounded-3xl border border-border/50 p-8 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="h-24 w-24 rounded-2xl object-cover border-4 border-background shadow-lg shrink-0" />
          ) : (
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/30 to-violet-500/30 border-4 border-background shadow-lg flex items-center justify-center text-4xl font-bold shrink-0 text-foreground">
              {user.username[0].toUpperCase()}
            </div>
          )}
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-1">
              <h1 className="text-2xl font-bold text-foreground">{user.username}</h1>
              {user.role === "admin" && <span className="text-xs bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full">Admin</span>}
            </div>
            <p className="text-sm text-muted-foreground">Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {streak > 0 && <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full font-semibold">🔥 {streak}-day streak</span>}
              <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full font-semibold">⚡ {xp.toLocaleString()} XP</span>
            </div>
          </div>
          {isOwnProfile && (
            <a href="/profile/edit" className="shrink-0 px-4 py-2 bg-muted/50 border border-border/50 text-foreground text-sm font-semibold rounded-xl hover:bg-muted transition-colors">
              Edit Profile
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total XP"   value={xp.toLocaleString()} icon="⚡" color="text-amber-400" />
        <StatCard label="Words Seen" value={total}   icon="👁️" />
        <StatCard label="Mastered"   value={mastered} icon="🎓" color="text-emerald-400" />
        <StatCard label="Day Streak" value={`${streak}d`} icon="🔥" color="text-orange-400" />
      </div>

      {/* Mastery bars */}
      {total > 0 && (
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
          <h2 className="font-bold text-foreground">Word Mastery</h2>
          {[["Learning", learning, "bg-amber-500"], ["Familiar", familiar, "bg-blue-500"], ["Mastered", mastered, "bg-emerald-500"]].map(([l, c, bg]) => (
            <div key={l as string} className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground"><span>{l}</span><span>{c} words</span></div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", bg as string)} style={{ width: `${Math.round(((c as number) / total) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity */}
      <div className="glass rounded-2xl border border-border/50 p-6"><ActivityGrid days={days} /></div>

      {/* Badges */}
      {user.userBadges.length > 0 ? (
        <div className="glass rounded-2xl border border-border/50 p-6 space-y-4">
          <h2 className="font-bold text-foreground">Badges ({user.userBadges.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {user.userBadges.map((ub) => (
              <div key={ub.id} className="glass rounded-xl border border-border/40 p-4 flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">{BADGE_EMOJI[ub.badge.name] ?? BADGE_EMOJI.default}</span>
                <p className="text-sm font-semibold text-foreground">{ub.badge.name}</p>
                <p className="text-xs text-muted-foreground">{ub.badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 glass rounded-2xl border border-dashed border-border/40">
          <p className="text-2xl mb-2">🏅</p><p className="text-sm text-muted-foreground">No badges yet.</p>
        </div>
      )}

      <div className="flex justify-center">
        <a href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Leaderboard
        </a>
      </div>
    </div>
  );
}
