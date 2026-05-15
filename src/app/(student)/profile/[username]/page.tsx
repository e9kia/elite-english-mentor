export const dynamic = 'force-dynamic';
import { notFound } from "next/navigation";
import { prisma }   from "@/lib/prisma";
import { cn }       from "@/lib/utils";
import type { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username}'s Profile — Elite English Mentor` };
}

function StatCard({ label, value, icon, color = "text-foreground" }: {
  label: string; value: string | number; icon: string; color?: string;
}) {
  return (
    <div className="elite-card rounded-[2rem] border border-gold/10 p-6 flex flex-col gap-3 hover:border-gold/30 transition-all duration-500 hover:shadow-lg hover:shadow-gold/5">
      <div className="flex items-center justify-between">
        <span className="text-3xl">{icon}</span>
        <span className={cn("text-3xl font-black tabular-nums", color)}>{value}</span>
      </div>
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}

function ActivityGrid({ days }: { days: { date: string; xp: number }[] }) {
  const max = Math.max(...days.map((d) => d.xp), 1);
  return (
    <div className="elite-card rounded-[2rem] border border-gold/10 p-6">
      <p className="text-[10px] font-black text-gold/60 uppercase tracking-widest mb-4">30-Day Activity</p>
      <div className="flex gap-1 flex-wrap">
        {days.map((d, i) => (
          <div key={i} title={`${d.date}: ${d.xp} XP`}
            className="h-5 w-5 rounded-md bg-primary transition-all hover:scale-125"
            style={{ opacity: d.xp === 0 ? 0.08 : 0.2 + (d.xp / max) * 0.8 }} />
        ))}
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true, username: true, avatarUrl: true, createdAt: true, role: true, lastSeen: true,
      team: { select: { name: true, id: true } },
      leaderboard: true,
      userBadges: { include: { badge: true }, orderBy: { earnedAt: "asc" } },
      wordMastery: { select: { masteryLevel: true } },
    },
  });
  if (!user) notFound();

  const session = await getServerSession(authOptions);
  const isOwnProfile = session?.user?.id === user.id;

  // --- Fix: XP Activity Grid ---
  // Use findMany instead of buggy groupBy on DateTime
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const xpEvents = await prisma.xpEvent.findMany({
    where: { userId: user.id, createdAt: { gte: thirtyDaysAgo } },
    select: { xpEarned: true, createdAt: true },
  });

  // Group manually by date string
  const dayMap: Record<string, number> = {};
  xpEvents.forEach((e) => {
    const key = new Date(e.createdAt).toDateString();
    dayMap[key] = (dayMap[key] ?? 0) + e.xpEarned;
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

  const isOnline = user.lastSeen && (Date.now() - new Date(user.lastSeen).getTime() < 5 * 60 * 1000);

  // XP level calculation
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpToNext = 500;

  const BADGE_EMOJI: Record<string, string> = { "First Word": "🌱", "Word Explorer": "🗺️", "Vocabulary Master": "👑", default: "🏅" };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in py-6">
      {/* Hero Card */}
      <div className="elite-card rounded-[3rem] border border-gold/15 p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gold/8 blur-[60px] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center gap-8">
          <div className="relative">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="h-28 w-28 rounded-[2rem] object-cover border-4 border-background shadow-xl shrink-0" />
            ) : (
              <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-primary/30 to-gold/30 border-4 border-background shadow-xl flex items-center justify-center text-5xl font-black shrink-0 text-foreground">
                {user.username[0].toUpperCase()}
              </div>
            )}
            <span className={cn(
              "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-[3px] border-background",
              isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
            )} />
          </div>
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start mb-2">
              <h1 className="text-3xl font-black text-foreground tracking-tight">{user.username}</h1>
              {user.role === "admin" && <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500 text-white px-3 py-1 rounded-full">Admin</span>}
              {user.team && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                  🛡️ {user.team.name}
                </span>
              )}
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {isOnline ? "🟢 Online now" : `Member since ${new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
            </p>

            {/* XP Level Bar */}
            <div className="mt-4 max-w-xs mx-auto sm:mx-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-gold uppercase tracking-widest">Level {level}</span>
                <span className="text-[10px] font-bold text-muted-foreground">{xpInLevel} / {xpToNext} XP</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden border border-border/50 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                  style={{ width: `${(xpInLevel / xpToNext) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-5 justify-center sm:justify-start">
              {streak > 0 && <span className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-xl font-bold shadow-lg shadow-amber-500/20">🔥 {streak} Day Streak</span>}
              <span className="text-xs bg-gradient-to-r from-primary to-emerald-600 text-white px-4 py-1.5 rounded-xl font-bold shadow-lg shadow-primary/20">⚡ {xp.toLocaleString()} XP</span>
            </div>
          </div>
          {isOwnProfile && (
            <Link href="/profile/edit" className="shrink-0 px-5 py-2.5 bg-gold/10 border border-gold/20 text-foreground text-sm font-bold rounded-2xl hover:bg-gold/20 transition-all active:scale-95 shadow-sm">
              ✏️ Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total XP"   value={xp.toLocaleString()} icon="⚡" color="text-gold" />
        <StatCard label="Words Seen" value={total}   icon="👁️" />
        <StatCard label="Mastered"   value={mastered} icon="🎓" color="text-emerald-400" />
        <StatCard label="Day Streak" value={`${streak}d`} icon="🔥" color="text-orange-400" />
      </div>

      {/* Mastery Breakdown */}
      {total > 0 && (
        <div className="elite-card rounded-[2rem] border border-gold/10 p-8 space-y-5">
          <h2 className="text-lg font-black text-foreground">Word Mastery Breakdown</h2>
          {([
            ["Learning", learning, "bg-amber-500", "text-amber-500"],
            ["Familiar", familiar, "bg-blue-500", "text-blue-500"],
            ["Mastered", mastered, "bg-emerald-500", "text-emerald-500"],
          ] as const).map(([label, count, bg, textColor]) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className={cn("font-bold", textColor)}>{label}</span>
                <span className="text-muted-foreground font-bold">{count} / {total}</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all duration-1000", bg)} style={{ width: `${Math.round((count / total) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Heatmap */}
      <ActivityGrid days={days} />

      {/* Badges */}
      {user.userBadges.length > 0 ? (
        <div className="elite-card rounded-[2rem] border border-gold/10 p-8 space-y-5">
          <h2 className="text-lg font-black text-foreground">Badges ({user.userBadges.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {user.userBadges.map((ub) => (
              <div key={ub.id} className="elite-card rounded-2xl border border-gold/10 p-5 flex flex-col items-center gap-2 text-center hover:border-gold/30 transition-colors">
                <span className="text-3xl">{BADGE_EMOJI[ub.badge.name] ?? BADGE_EMOJI.default}</span>
                <p className="text-sm font-bold text-foreground">{ub.badge.name}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{ub.badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 elite-card rounded-[2rem] border border-dashed border-gold/10">
          <p className="text-3xl mb-2">🏅</p>
          <p className="text-sm font-bold text-foreground">No badges yet</p>
          <p className="text-xs text-muted-foreground mt-1">Complete units and maintain streaks to earn badges.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-6 pt-4">
        <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors font-bold">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Leaderboard
        </Link>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors font-bold">
          Dashboard
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>
    </div>
  );
}
