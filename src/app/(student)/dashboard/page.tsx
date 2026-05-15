"use client";

// =====================================================================
//  Dashboard — Foundation Protocol: Vertical Duolingo-Style Path
//  180-unit continuous journey with cross-level gating
//  Designed by Ali Jitam ❤️
// =====================================================================

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ── Level Metadata ───────────────────────────────────────────────────
const LEVELS = [
  { number: 1, title: "Essential 1",     color: "from-emerald-500 to-teal-500",   glow: "shadow-emerald-500/20", icon: "🌱", accent: "emerald" },
  { number: 2, title: "Essential 2",     color: "from-blue-500 to-cyan-500",      glow: "shadow-blue-500/20",    icon: "🚀", accent: "blue"    },
  { number: 3, title: "Essential 3",     color: "from-violet-500 to-fuchsia-500", glow: "shadow-violet-500/20",  icon: "💎", accent: "violet"  },
  { number: 4, title: "Intermediate 1",  color: "from-amber-500 to-orange-500",   glow: "shadow-amber-500/20",   icon: "⚔️", accent: "amber"   },
  { number: 5, title: "Intermediate 2",  color: "from-rose-500 to-pink-500",      glow: "shadow-rose-500/20",    icon: "🔥", accent: "rose"    },
  { number: 6, title: "Advanced",        color: "from-slate-700 to-slate-900",    glow: "shadow-slate-500/20",   icon: "👑", accent: "slate"   },
];

interface UnitNode {
  id: number;
  number: number;
  title: string;
  levelNumber: number;
  levelTitle: string;
  levelIcon: string;
  levelColor: string;
  wordCount: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  isActive: boolean;  // current unit to work on
  currentWordIndex: number;
}

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
  if (hour < 6)  return { greeting: "Night Owl",       emoji: "🦉", subtitle: "Burning the midnight oil? Elite." };
  if (hour < 12) return { greeting: "Good Morning",    emoji: "☀️", subtitle: "A fresh start to master new words." };
  if (hour < 17) return { greeting: "Good Afternoon",  emoji: "🔥", subtitle: "Keep the momentum going strong." };
  if (hour < 21) return { greeting: "Good Evening",    emoji: "🌙", subtitle: "Evening sessions build lasting habits." };
  return { greeting: "Good Night", emoji: "✨", subtitle: "One more unit before rest?" };
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [unitNodes, setUnitNodes] = useState<UnitNode[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);
  const [wordsLearned, setWordsLearned] = useState(0);

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
          setTotalXp(data.totalXp || 0);
          setWordsLearned(data.wordsLearned || 0);

          // ── Build the 180-unit linear path ──
          const nodes: UnitNode[] = [];
          const levels = data.levels || [];

          // Flatten all units across all levels in order
          for (const level of levels) {
            const levelMeta = LEVELS.find(l => l.number === level.number);
            for (const unit of level.units || []) {
              nodes.push({
                id: unit.id,
                number: unit.number,
                title: unit.title,
                levelNumber: level.number,
                levelTitle: levelMeta?.title ?? `Level ${level.number}`,
                levelIcon: levelMeta?.icon ?? "📚",
                levelColor: levelMeta?.color ?? "from-gray-500 to-gray-600",
                wordCount: unit.wordCount || unit._count?.words || 0,
                isUnlocked: false,
                isCompleted: unit.progress?.status === "completed",
                isActive: false,
                currentWordIndex: unit.progress?.currentWordIndex ?? 0,
              });
            }
          }

          // ── Apply Cross-Level Gating Logic ──
          // Unit 0 is always unlocked. Unit N is unlocked only if Unit N-1 is completed.
          let foundActive = false;
          for (let i = 0; i < nodes.length; i++) {
            if (i === 0) {
              nodes[i].isUnlocked = true;
            } else {
              nodes[i].isUnlocked = nodes[i - 1].isCompleted;
            }

            // A completed unit is always "unlocked"
            if (nodes[i].isCompleted) {
              nodes[i].isUnlocked = true;
            }

            // Find the first unlocked, non-completed unit = active
            if (!foundActive && nodes[i].isUnlocked && !nodes[i].isCompleted && nodes[i].wordCount > 0) {
              nodes[i].isActive = true;
              foundActive = true;
            }
          }

          // If nothing found active yet (all completed or first time), make the first available active
          if (!foundActive) {
            const firstAvailable = nodes.find(n => n.isUnlocked && !n.isCompleted);
            if (firstAvailable) firstAvailable.isActive = true;
          }

          setUnitNodes(nodes);
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

  // Computed stats
  const completedCount = unitNodes.filter(n => n.isCompleted).length;
  const activeNode = unitNodes.find(n => n.isActive);
  const totalUnits = unitNodes.length;
  const overallProgress = totalUnits > 0 ? Math.round((completedCount / totalUnits) * 100) : 0;

  return (
    <div className="flex gap-8 pb-24 animate-fade-in relative">
      {/* Main Content Area */}
      <div className="flex-1 space-y-10 min-w-0">

        {/* ═══ HERO SECTION: "Next Step" ═══ */}
        <div className="elite-card rounded-[3rem] p-8 md:p-12 relative overflow-hidden gradient-shine border border-gold/10">
          {/* Floating Glow Orbs */}
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/8 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-gold/6 blur-[60px] pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <span className="h-px w-12 bg-gold/30" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Elite English Mentor</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground leading-[1.1]">
                {emoji} {greeting},
                <br />
                <span className="text-primary italic">{session?.user?.name || "Scholar"}</span>
              </h1>
              <p className="text-base text-muted-foreground font-medium max-w-lg">
                {subtitle} — Crafted by <span className="text-gold font-black">Ali Jitam ❤️</span>
              </p>

              {/* ── Continue Learning Button ── */}
              {activeNode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    href={`/learn/${activeNode.id}`}
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-emerald-400 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all active:scale-95 group"
                  >
                    <span className="text-2xl">{activeNode.levelIcon}</span>
                    <div className="text-left">
                      <span className="block text-sm opacity-80 font-bold">
                        Level {activeNode.levelNumber} · Unit {activeNode.number}
                      </span>
                      <span className="block">Continue Learning →</span>
                    </div>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-2 font-bold">
                    📚 {activeNode.title}
                    {activeNode.currentWordIndex > 0 && (
                      <span className="text-primary ml-2">· Word {activeNode.currentWordIndex + 1}</span>
                    )}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex flex-row md:flex-col gap-4 shrink-0">
              <div className="elite-card rounded-2xl border border-gold/10 px-6 py-4 text-center min-w-[100px]">
                <p className="text-2xl font-black text-gold tabular-nums">⚡ {totalXp.toLocaleString()}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total XP</p>
              </div>
              <div className="elite-card rounded-2xl border border-primary/10 px-6 py-4 text-center min-w-[100px]">
                <p className="text-2xl font-black text-primary tabular-nums">📚 {wordsLearned}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Words Learned</p>
              </div>
              <div className="elite-card rounded-2xl border border-emerald-500/10 px-6 py-4 text-center min-w-[100px]">
                <p className="text-2xl font-black text-emerald-500 tabular-nums">✅ {completedCount}</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Units Done</p>
              </div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="relative mt-8 pt-6 border-t border-border/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gold/50">Journey Progress</span>
              <span className="text-[10px] font-black text-primary">{overallProgress}% · {completedCount}/{totalUnits}</span>
            </div>
            <div className="h-2.5 bg-muted/20 rounded-full overflow-hidden border border-border/20">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-gold rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ boxShadow: "0 0 12px rgba(16,185,129,0.4)" }}
              />
            </div>
          </div>
        </div>

        {/* ═══ THE VERTICAL PATH — Duolingo Style ═══ */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-gold/30" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gold/70">Your Learning Path</h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-20 rounded-2xl shimmer" />
              ))}
            </div>
          ) : (
            <div className="relative">
              {/* The vertical line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/30 via-gold/20 to-muted/10" />

              <div className="space-y-1">
                {unitNodes.map((node, i) => {
                  // Check if this is the first unit of a new level → show level separator
                  const isLevelStart = node.number === 1;
                  const prevNode = i > 0 ? unitNodes[i - 1] : null;
                  const isNewLevel = isLevelStart || (prevNode && prevNode.levelNumber !== node.levelNumber);

                  return (
                    <div key={node.id}>
                      {/* Level Milestone Separator */}
                      {isNewLevel && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="flex items-center gap-4 py-6 pl-2"
                        >
                          <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg bg-gradient-to-br shrink-0 z-10",
                            node.levelColor
                          )}>
                            {node.levelIcon}
                          </div>
                          <div className="flex-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gold/50">Tier {node.levelNumber}</p>
                            <h3 className="text-xl font-black text-foreground">{node.levelTitle}</h3>
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent max-w-32" />
                        </motion.div>
                      )}

                      {/* Unit Node */}
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.015, duration: 0.3 }}
                        className={cn(
                          "flex items-center gap-4 pl-2 group relative",
                          node.isActive ? "py-2" : "py-0.5"
                        )}
                      >
                        {/* Node Circle */}
                        <div className={cn(
                          "relative z-10 shrink-0 flex items-center justify-center rounded-full transition-all duration-300",
                          node.isActive
                            ? "h-14 w-14 bg-gradient-to-br from-primary to-emerald-400 shadow-xl shadow-primary/30 ring-4 ring-primary/20"
                            : node.isCompleted
                              ? "h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-500/20"
                              : node.isUnlocked
                                ? "h-10 w-10 bg-muted border-2 border-primary/30 hover:border-primary/60"
                                : "h-8 w-8 bg-muted/30 border border-border/20"
                        )}>
                          {node.isCompleted ? (
                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : node.isActive ? (
                            <span className="text-white font-black text-lg animate-pulse">{node.number}</span>
                          ) : node.isUnlocked ? (
                            <span className="text-foreground/60 font-bold text-sm">{node.number}</span>
                          ) : (
                            <svg className="h-3 w-3 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>

                        {/* Unit Card */}
                        {node.isUnlocked ? (
                          <Link
                            href={`/learn/${node.id}`}
                            className={cn(
                              "flex-1 elite-card rounded-2xl px-5 py-3 transition-all duration-300 border group/card",
                              node.isActive
                                ? "border-primary/30 bg-primary/5 shadow-lg shadow-primary/10 hover:shadow-xl hover:shadow-primary/20 hover:border-primary/50"
                                : node.isCompleted
                                  ? "border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5"
                                  : "border-border/20 hover:border-primary/30 hover:bg-muted/30"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md",
                                    node.isActive
                                      ? "bg-primary/10 text-primary"
                                      : node.isCompleted
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-muted text-muted-foreground/50"
                                  )}>
                                    U{node.number}
                                  </span>
                                  <h4 className={cn(
                                    "text-sm font-bold truncate",
                                    node.isActive ? "text-foreground" : node.isCompleted ? "text-foreground/80" : "text-muted-foreground"
                                  )}>
                                    {node.title}
                                  </h4>
                                </div>
                                {node.wordCount > 0 && (
                                  <p className="text-[10px] text-muted-foreground/50 font-bold mt-0.5">
                                    {node.wordCount} words
                                    {node.currentWordIndex > 0 && !node.isCompleted && (
                                      <span className="text-primary ml-1">· Word {node.currentWordIndex + 1}</span>
                                    )}
                                  </p>
                                )}
                              </div>

                              {/* Right indicator */}
                              <div className="shrink-0 ml-3">
                                {node.isActive ? (
                                  <span className="inline-flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-primary/20">
                                    Start →
                                  </span>
                                ) : node.isCompleted ? (
                                  <span className="text-emerald-500 text-xs font-black">✅</span>
                                ) : (
                                  <svg className="h-4 w-4 text-muted-foreground/30 group-hover/card:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className={cn(
                            "flex-1 elite-card rounded-2xl px-5 py-3 border border-border/10 opacity-40 cursor-not-allowed"
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 px-1.5 py-0.5 rounded-md bg-muted/30">
                                    U{node.number}
                                  </span>
                                  <h4 className="text-sm font-bold text-muted-foreground/40 truncate">
                                    {node.title}
                                  </h4>
                                </div>
                                {node.wordCount > 0 && (
                                  <p className="text-[10px] text-muted-foreground/30 font-bold mt-0.5">{node.wordCount} words</p>
                                )}
                              </div>
                              <svg className="h-4 w-4 text-muted-foreground/20 shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT SIDEBAR: ELITE FRIENDS ═══ */}
      <aside className="hidden lg:flex flex-col w-80 space-y-6 shrink-0">
        <div className="elite-card rounded-[2.5rem] p-8 border border-gold/10 flex-1 flex flex-col sticky top-24 max-h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black text-foreground tracking-tight">Elite <span className="text-gold">Friends</span></h3>
            <Link href="/leaderboard" className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center text-gold hover:bg-gold hover:text-white transition-all" title="Find friends">
               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
               </svg>
            </Link>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
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
              friends.slice(0, 8).map((f) => {
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

          {friends.length > 8 && (
            <Link href="/leaderboard" className="mt-6 w-full py-3 rounded-2xl bg-gold/5 text-gold text-xs font-black uppercase tracking-widest hover:bg-gold/10 transition-all text-center block border border-gold/10">
               View All ({friends.length})
            </Link>
          )}
        </div>
      </aside>
    </div>
  );
}
