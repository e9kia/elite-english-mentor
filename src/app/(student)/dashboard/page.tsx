"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const LEVELS = [
  { number: 1, title: "Essential 1", color: "from-emerald-500 to-teal-500", glow: "shadow-emerald-500/20", icon: "🌱", description: "Foundational English vocabulary for beginners." },
  { number: 2, title: "Essential 2", color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/20", icon: "🚀", description: "Expanding core concepts and daily interactions." },
  { number: 3, title: "Essential 3", color: "from-violet-500 to-fuchsia-500", glow: "shadow-violet-500/20", icon: "💎", description: "Mastering common expressions and structures." },
  { number: 4, title: "Intermediate 1", color: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20", icon: "⚔️", description: "Complex grammar and professional terminology." },
  { number: 5, title: "Intermediate 2", color: "from-rose-500 to-pink-500", glow: "shadow-rose-500/20", icon: "🔥", description: "Nuanced communication and abstract concepts." },
  { number: 6, title: "Advanced", color: "from-slate-700 to-slate-900", glow: "shadow-slate-500/20", icon: "👑", description: "Academic proficiency and master-level vocabulary." },
];

interface FriendData {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    avatarUrl: string | null;
    lastSeen: string | null;
    leaderboard: { totalXp: number; streakDays: number } | null;
  };
}

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function getGreeting(): { greeting: string; emoji: string; subtitle: string } {
  const hour = new Date().getHours();
  if (hour < 6)  return { greeting: "Night Owl", emoji: "🦉", subtitle: "Burning the midnight oil? Elite." };
  if (hour < 12) return { greeting: "Good Morning", emoji: "☀️", subtitle: "A fresh start to master new words." };
  if (hour < 17) return { greeting: "Good Afternoon", emoji: "🔥", subtitle: "Keep the momentum going strong." };
  if (hour < 21) return { greeting: "Good Evening", emoji: "🌙", subtitle: "Evening sessions build lasting habits." };
  return { greeting: "Good Night", emoji: "✨", subtitle: "One more unit before rest?" };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [activeLevel, setActiveLevel] = useState(1);
  const [levelsData, setLevelsData] = useState<any[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);

  const { greeting, emoji, subtitle } = getGreeting();

  useEffect(() => {
    async function fetchData() {
      try {
        const [progRes, friendRes] = await Promise.all([
          fetch("/api/student/progress"),
          fetch("/api/social/friends"),
        ]);
        if (progRes.ok) {
          const data = await progRes.json();
          setLevelsData(data.levels || []);
        }
        if (friendRes.ok) {
          const data = await friendRes.json();
          setFriends(data.friends || []);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentLevelData = levelsData.find(l => l.number === activeLevel);
  const totalUnits = levelsData.reduce((sum: number, l: any) => sum + (l.units?.length || 0), 0);

  return (
    <div className="flex gap-8 pb-24 animate-fade-in relative">
      {/* Main Content Area */}
      <div className="flex-1 space-y-10 min-w-0">

        {/* ═══ PREMIUM HERO SECTION ═══ */}
        <div className="elite-card rounded-[3rem] p-8 md:p-12 relative overflow-hidden gradient-shine border border-gold/10">
          {/* Floating Glow Orbs */}
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gold/6 blur-[60px] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-12 bg-gold/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Elite English Mentor</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground leading-[1.1]">
                {emoji} {greeting},
                <br />
                <span className="text-primary italic">{session?.user?.name || "Scholar"}</span>
              </h1>
              <p className="text-base text-muted-foreground font-medium max-w-lg">
                {subtitle} — Crafted by <span className="text-gold font-black">Ali Jitam ❤️</span>
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-row md:flex-col gap-4 shrink-0">
              <div className="elite-card rounded-2xl border border-gold/10 px-6 py-4 text-center min-w-[100px]">
                <p className="text-2xl font-black text-gold tabular-nums">⚡ {totalXp.toLocaleString()}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total XP</p>
              </div>
              <div className="elite-card rounded-2xl border border-primary/10 px-6 py-4 text-center min-w-[100px]">
                <p className="text-2xl font-black text-primary tabular-nums">📚 {totalUnits}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Units Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 6 LEVEL CARDS — Premium Grid ═══ */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gold/30" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gold/70">Learning Tiers</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {LEVELS.map((level, i) => {
              const data = levelsData.find(l => l.number === level.number);
              const unitCount = data?.units?.length || 0;
              const progress = Math.round((unitCount / 30) * 100);

              return (
                <motion.button
                  key={level.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  onClick={() => setActiveLevel(level.number)}
                  className={cn(
                    "relative elite-card gradient-shine group rounded-[2rem] p-7 text-left transition-all duration-500 border overflow-hidden",
                    activeLevel === level.number
                      ? `border-primary/40 shadow-2xl ${level.glow} ring-2 ring-primary/20 scale-[1.02]`
                      : "border-border/20 hover:border-gold/20 hover:shadow-xl"
                  )}
                >
                  {/* Level Icon */}
                  <div className={cn(
                    "h-14 w-14 rounded-2xl mb-5 flex items-center justify-center text-2xl shadow-lg bg-gradient-to-br transition-transform group-hover:scale-110",
                    level.color
                  )}>
                    {level.icon}
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gold/50 mb-1.5">Tier {level.number}</p>
                  <h3 className="text-xl font-black text-foreground mb-2">{level.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-5">{level.description}</p>

                  {/* Progress Bar */}
                  <div className="space-y-2 pt-4 border-t border-border/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground">{unitCount} / 30 Units</span>
                      <span className="text-[10px] font-black text-primary">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000 bg-gradient-to-r", level.color)}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Indicator */}
                  {activeLevel === level.number && (
                    <span className="absolute top-5 right-5 flex h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-lg shadow-primary/50" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ═══ UNIT GRID ═══ */}
        <motion.div
          key={activeLevel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="elite-card rounded-[3rem] p-8 md:p-12 border border-gold/10"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-2 tracking-tight">
                Level {activeLevel} <span className="text-primary italic">Curriculum</span>
              </h2>
              <p className="text-muted-foreground font-medium text-sm">Master all 30 units to advance.</p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent mx-8 hidden xl:block" />
            <div className="flex flex-col items-end gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold/50">Mastery</span>
              <div className="h-3 w-64 bg-muted/20 rounded-full overflow-hidden border border-border/30 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                  style={{ width: `${(currentLevelData?.units?.length || 0) / 30 * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3">
            {Array.from({ length: 30 }).map((_, i) => {
              const unitNumber = i + 1;
              const unit = currentLevelData?.units?.find((u: any) => u.number === unitNumber);
              const isUnlocked = !!unit;

              return (
                <div key={unitNumber} className="relative group">
                  {isUnlocked ? (
                    <Link
                      href={`/learn/${unit.id}`}
                      className="aspect-square elite-card rounded-2xl flex flex-col items-center justify-center border border-primary/20 bg-primary/5 hover:bg-primary hover:text-white transition-all duration-300 group hover:scale-110 hover:shadow-xl hover:shadow-primary/20"
                    >
                      <span className="text-[7px] font-black opacity-40 mb-0.5">UNIT</span>
                      <span className="text-lg font-black">{unitNumber}</span>
                    </Link>
                  ) : (
                    <div className="aspect-square elite-card rounded-2xl flex flex-col items-center justify-center border border-border/10 opacity-20 cursor-not-allowed">
                      <svg className="h-3.5 w-3.5 mb-0.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-[7px] font-black">{unitNumber}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ═══ QUICK ACTION TILES ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: "Elite AI Tutor", icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z", color: "from-violet-500/10 to-fuchsia-500/5", text: "text-violet-500", border: "border-violet-500/10 hover:border-violet-500/30" },
            { label: "Competitive Quizzes", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", color: "from-emerald-500/10 to-teal-500/5", text: "text-emerald-500", border: "border-emerald-500/10 hover:border-emerald-500/30" },
            { label: "Voice Recognition", icon: "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z", color: "from-gold/10 to-amber-500/5", text: "text-gold", border: "border-gold/10 hover:border-gold/30" },
          ].map((feat) => (
            <div key={feat.label} className={cn("elite-card rounded-[2rem] p-7 relative overflow-hidden group cursor-not-allowed border transition-all duration-300", feat.border)}>
              <div className="absolute top-5 right-5">
                <span className="bg-foreground/5 text-foreground/30 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-foreground/5">
                  Soon
                </span>
              </div>
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-5 bg-gradient-to-br", feat.color, feat.text)}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feat.icon} />
                </svg>
              </div>
              <h4 className="text-lg font-black text-foreground mb-1">{feat.label}</h4>
              <p className="text-[10px] text-muted-foreground font-medium italic opacity-50">Implementation in progress.</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ RIGHT SIDEBAR: ELITE FRIENDS ═══ */}
      <aside className="hidden lg:flex flex-col w-80 space-y-6 shrink-0">
        <div className="elite-card rounded-[2.5rem] p-8 border border-gold/10 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-foreground tracking-tight">Elite <span className="text-gold">Friends</span></h3>
            <Link href="/leaderboard" className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-white transition-all" title="Find friends">
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
               </svg>
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {loading ? (
              <>
                {[1,2,3].map(i => (
                  <div key={i} className="h-16 rounded-2xl shimmer" />
                ))}
              </>
            ) : friends.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gold/10 flex items-center justify-center text-2xl border border-gold/20">👥</div>
                <div>
                  <p className="text-sm font-bold text-foreground">No friends yet</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Search on the Leaderboard!</p>
                </div>
                <Link href="/leaderboard" className="text-xs font-black text-gold hover:underline uppercase tracking-widest">
                  Find Friends →
                </Link>
              </div>
            ) : (
              friends.slice(0, 6).map((f) => {
                const online = isOnline(f.friend.lastSeen);
                return (
                  <Link
                    key={f.friendshipId}
                    href={`/profile/${f.friend.username}`}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/30 transition-colors group cursor-pointer border border-transparent hover:border-gold/10"
                  >
                    <div className="relative">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-gold/10 flex items-center justify-center font-black text-primary border border-primary/20 text-sm">
                        {f.friend.avatarUrl ? (
                          <img src={f.friend.avatarUrl} alt="" className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          f.friend.username[0]?.toUpperCase()
                        )}
                      </div>
                      <span className={cn(
                        "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background",
                        online ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground leading-none truncate">{f.friend.username}</p>
                      <p className="text-[10px] text-muted-foreground font-bold mt-1">
                        ⚡ {(f.friend.leaderboard?.totalXp ?? 0).toLocaleString()} XP
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {friends.length > 6 && (
            <Link href="/leaderboard" className="mt-6 w-full py-3 rounded-2xl bg-gold/5 text-gold text-xs font-black uppercase tracking-widest hover:bg-gold/10 transition-all text-center block border border-gold/10">
               View All ({friends.length})
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
