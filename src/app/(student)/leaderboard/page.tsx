"use client";
// src/app/(student)/leaderboard/page.tsx
// Dynamic leaderboard with Global / Friends tabs + Add Friend search

import { useState, useEffect, useCallback, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ── Types ────────────────────────────────────────────────────── */
interface Leader {
  rank: number; userId: string; username: string;
  totalXp: number; masteredWords: number; joinedAt: string;
  friendshipStatus?: string | null;
}
interface SearchUser {
  id: string; username: string; avatarUrl: string | null;
  role: string; leaderboard: { totalXp: number } | null;
  friendshipStatus: string | null;
}

/* ── Podium card ──────────────────────────────────────────────── */
const RANK_STYLE: Record<number, { bg: string; text: string; badge: string }> = {
  1: { bg: "border-amber-500/40 bg-amber-500/10",  text: "text-amber-400",  badge: "🥇" },
  2: { bg: "border-slate-400/30 bg-slate-400/10",  text: "text-slate-300",  badge: "🥈" },
  3: { bg: "border-amber-700/30 bg-amber-700/10",  text: "text-amber-600",  badge: "🥉" },
};

function Avatar({ name, size = 10 }: { name: string; size?: number }) {
  const s = `h-${size} w-${size}`;
  return (
    <div className={cn(s, "rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0")}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function AddFriendBtn({ userId, status, onAction }: {
  userId: string; status: string | null;
  onAction: (id: string, action: "add") => Promise<void>;
}) {
  const [pending, start] = useTransition();
  if (status === "accepted") return (
    <a href={`/compete/challenge/${userId}`} className="text-xs px-4 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 font-bold flex items-center gap-1.5 transition-colors group">
      <span className="group-hover:scale-110 transition-transform">⚔️</span> Challenge
    </a>
  );
  if (status === "pending")  return <span className="text-xs text-muted-foreground px-2">Pending…</span>;
  return (
    <button
      onClick={() => start(() => onAction(userId, "add"))}
      disabled={pending}
      className="text-xs px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
    >
      {pending ? "…" : "+ Add"}
    </button>
  );
}

/* ── Main page ────────────────────────────────────────────────── */
export default function LeaderboardPage() {
  const [tab, setTab]           = useState<"global" | "friends" | "teams">("global");
  const [global, setGlobal]     = useState<Leader[]>([]);
  const [friends, setFriends]   = useState<Leader[]>([]);
  const [teams, setTeams]       = useState<any[]>([]);
  const [search, setSearch]     = useState("");
  const [results, setResults]   = useState<SearchUser[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [searching, setSearching] = useState(false);

  /* fetch leaderboard */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [lbRes, frRes, tmRes] = await Promise.all([
          fetch("/api/social/leaderboard"),
          fetch("/api/social/friends"),
          fetch("/api/social/teams"),
        ]);
        const lb  = await lbRes.json();
        const fr  = await frRes.json();
        const tm  = await tmRes.json();

        setGlobal(lb.global  ?? []);
        setFriends(lb.friends ?? []);
        setTeams(tm.teams ?? []);

        // Build status map
        const map: Record<string, string> = {};
        (fr.friends ?? []).forEach((f: { friend: { id: string } }) => { map[f.friend.id] = "accepted"; });
        (fr.pending ?? []).forEach((f: { addressee: { id: string } }) => { map[f.addressee.id] = "pending"; });
        setStatuses(map);
      } catch { toast.error("Failed to load leaderboard"); }
      finally  { setLoading(false); }
    })();
  }, []);

  /* search users */
  useEffect(() => {
    if (search.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/social/search?q=${encodeURIComponent(search)}`);
        const d = await r.json();
        setResults(d.users ?? []);
      } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const sendRequest = useCallback(async (targetId: string, _action: "add") => {
    const r = await fetch("/api/social/friends", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetId }),
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.error); return; }
    toast.success("Friend request sent! 🎉");
    setStatuses((s) => ({ ...s, [targetId]: "pending" }));
    setResults((rs) => rs.map((u) => u.id === targetId ? { ...u, friendshipStatus: "pending" } : u));
  }, []);

  const rows = tab === "global" ? global : friends;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b border-border/40 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">Leaderboard</h1>
          <p className="text-sm font-medium text-muted-foreground">Compete with friends · Earn XP · Climb the ranks</p>
        </div>
        <a href="/dashboard" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-muted border border-border/50 text-sm font-semibold text-foreground rounded-full shadow-sm transition-all self-start md:self-auto">
          <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Hub
        </a>
      </div>

      {/* Search bar */}
      <div className="relative">
        <div className="glass rounded-2xl border border-border/50 flex items-center gap-3 px-4 py-3">
          <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users to add as friends…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
          />
          {searching && (
            <svg className="h-4 w-4 text-primary animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
        </div>

        {/* Search results dropdown */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 glass rounded-2xl border border-border/50 z-30 overflow-hidden"
            >
              {results.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors border-b border-border/30 last:border-0">
                  <Avatar name={u.username} size={9} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{u.username}</p>
                    <p className="text-xs text-muted-foreground">⚡ {(u.leaderboard?.totalXp ?? 0).toLocaleString()} XP</p>
                  </div>
                  <AddFriendBtn userId={u.id} status={u.friendshipStatus} onAction={sendRequest} />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl border border-border/50">
        {(["global", "friends", "teams"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize",
              tab === t ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-muted-foreground hover:text-foreground")}>
            {t === "global" ? "🌍 Global" : t === "friends" ? "👥 Friends" : "🛡️ Teams"}
          </button>
        ))}
      </div>

      {/* Podium — top 3 */}
      {!loading && rows.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 items-end">
          {[rows[1], rows[0], rows[2]].map((user, i) => {
            const ranks = [2, 1, 3]; const r = ranks[i];
            const st = RANK_STYLE[r];
            return (
              <a key={user.userId} href={`/profile/${user.username}`}
                className={cn("glass rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-1", st.bg)}>
                <span className="text-2xl">{st.badge}</span>
                <Avatar name={user.username} size={12} />
                <p className="font-bold text-sm text-foreground truncate w-full text-center">{user.username}</p>
                <p className={cn("text-xs font-bold", st.text)}>⚡ {user.totalXp.toLocaleString()}</p>
              </a>
            );
          })}
        </div>
      )}

      {/* Rankings table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl shimmer" />)}
          </div>
        ) : (tab === "teams" ? teams.length === 0 : rows.length === 0) ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-3xl">{tab === "friends" ? "👥" : tab === "teams" ? "🛡️" : "🏆"}</p>
            <p className="font-semibold text-foreground">
              {tab === "friends" ? "Search and Add Friends to start competing!" : tab === "teams" ? "No teams have been created yet." : "No rankings yet"}
            </p>
            <p className="text-sm text-muted-foreground">Start studying to earn XP and appear here</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase w-10">#</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{tab === "teams" ? "Team" : "User"}</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">XP</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">{tab === "teams" ? "Members" : "Mastered"}</th>
                <th className="text-right px-5 py-3 w-24 hidden sm:table-cell" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              <AnimatePresence>
                {tab === "teams" ? (
                  teams.map((team, i) => {
                    const st = RANK_STYLE[i + 1];
                    return (
                      <motion.tr key={team.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">{st ? <span className="text-xl">{st.badge}</span> : <span className="text-muted-foreground font-mono">{i + 1}</span>}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                              {team.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{team.name}</p>
                              <p className="text-xs text-muted-foreground">Led by {team.leader.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right font-bold">
                          <span className={st ? st.text : "text-foreground"}>⚡ {team.totalXp.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4 text-right hidden sm:table-cell">
                          <span className="text-emerald-400 font-semibold">{team.memberCount}/10</span>
                          <span className="text-xs text-muted-foreground ml-1">members</span>
                        </td>
                        <td className="px-4 py-4 text-right hidden sm:table-cell">
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  rows.map((user, i) => {
                    const st = RANK_STYLE[user.rank];
                    return (
                      <motion.tr key={user.userId}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">{st ? <span className="text-xl">{st.badge}</span> : <span className="text-muted-foreground font-mono">{user.rank}</span>}</td>
                        <td className="px-4 py-4">
                          <a href={`/profile/${user.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <Avatar name={user.username} size={9} />
                            <div>
                              <p className="font-semibold text-foreground">{user.username}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                              </p>
                            </div>
                          </a>
                        </td>
                        <td className="px-4 py-4 text-right font-bold">
                          <span className={st ? st.text : "text-foreground"}>⚡ {user.totalXp.toLocaleString()}</span>
                        </td>
                        <td className="px-5 py-4 text-right hidden sm:table-cell">
                          <span className="text-emerald-400 font-semibold">{user.masteredWords}</span>
                          <span className="text-xs text-muted-foreground ml-1">words</span>
                        </td>
                        <td className="px-4 py-4 text-right hidden sm:table-cell">
                          <AddFriendBtn userId={user.userId} status={statuses[user.userId] ?? null} onAction={sendRequest} />
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">XP is earned by rating flashcards · Updates in real-time</p>
    </div>
  );
}
