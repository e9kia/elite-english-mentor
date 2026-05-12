"use client";
import { useState, useEffect, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description: string | null;
  leader: { username: string; avatarUrl: string | null };
  memberCount: number;
  totalXp: number;
  createdAt: string;
}

export default function TeamsPage() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();
  const [search, setSearch] = useState("");

  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const fetchTeams = async () => {
    try {
      const res = await fetch("/api/social/teams");
      const data = await res.json();
      setTeams(data.teams || []);
    } catch {
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/social/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: createName, description: createDesc }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Team created! 🛡️");
      setCreateName("");
      setCreateDesc("");
      fetchTeams();
    });
  };

  const handleJoin = async (teamId: string) => {
    start(async () => {
      const res = await fetch("/api/social/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", teamId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Joined team! 🎉");
      fetchTeams();
    });
  };

  const handleLeave = async () => {
    start(async () => {
      const res = await fetch("/api/social/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success("Left team.");
      fetchTeams();
    });
  };

  // Find user's current team
  const myTeam = teams.find(t => t.leader.username === session?.user?.username) ||
    null; // Simplified: check leader match. Full check would need member list from API.

  // Filter teams by search
  const filteredTeams = search.trim()
    ? teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : teams;

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border/40 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="h-px w-8 bg-primary/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Social Layer</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter">
            Team <span className="text-primary italic">Hub</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2">Join forces · Max 10 members · Dominate the leaderboard</p>
        </div>
        <a href="/dashboard" className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card hover:bg-muted border border-border/50 text-sm font-bold text-foreground rounded-2xl shadow-sm transition-all self-start md:self-auto">
          <svg className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </a>
      </div>

      {/* Search Bar */}
      <div className="glass rounded-2xl border border-border/50 flex items-center gap-3 px-4 py-3">
        <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams by name..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Create Team */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-[2rem] p-7 border border-border/50 shadow-xl">
            <h2 className="text-xl font-black text-foreground mb-5">Create a <span className="text-primary">Team</span></h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Team Name</label>
                <input
                  value={createName} onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Grammar Gladiators"
                  className="w-full mt-1.5 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description</label>
                <textarea
                  value={createDesc} onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="What's your team about?"
                  className="w-full mt-1.5 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={pending || !createName.trim()}
                className="w-full bg-primary text-white font-black py-3 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {pending ? "Creating..." : "Create Team"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Team List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-foreground">
              {search ? `Results for "${search}"` : "All Teams"}
            </h2>
            <span className="text-xs font-bold text-muted-foreground">{filteredTeams.length} teams</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
            </div>
          ) : filteredTeams.length === 0 ? (
            <div className="py-16 text-center glass rounded-[2rem] border border-dashed border-border/50">
              <p className="text-3xl mb-2">🛡️</p>
              <p className="font-bold text-foreground">{search ? "No teams match your search" : "No teams yet"}</p>
              <p className="text-sm text-muted-foreground mt-1">{search ? "Try a different search term." : "Be the first to create one!"}</p>
            </div>
          ) : (
            filteredTeams.map((team, idx) => (
              <div key={team.id} className="glass rounded-[2rem] p-6 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/10 flex items-center justify-center text-lg font-black text-primary border border-primary/20">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-foreground flex items-center gap-2">
                        {team.name}
                        {team.memberCount >= 10 && <span className="text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase font-black">Full</span>}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-bold">Led by <span className="text-foreground">{team.leader.username}</span></p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{team.description || "No description provided."}</p>
                  <div className="flex gap-3">
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/10">
                      👥 {team.memberCount}/10
                    </span>
                    <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/10">
                      ⚡ {team.totalXp.toLocaleString()} XP
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleJoin(team.id)}
                  disabled={pending || team.memberCount >= 10}
                  className="shrink-0 px-6 py-3 bg-background border border-border text-foreground text-sm font-black rounded-2xl hover:bg-muted hover:border-primary/30 transition-all disabled:opacity-40 shadow-sm active:scale-95"
                >
                  Join Team
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
