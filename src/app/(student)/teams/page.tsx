"use client";
import { useState, useEffect, useTransition } from "react";
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();

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

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/social/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: createName, description: createDesc }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Team created successfully!");
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
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Joined team successfully!");
      fetchTeams();
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-border/40 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-2">Team Hub</h1>
          <p className="text-sm font-medium text-muted-foreground">Join forces · Max 10 members · Dominate the leaderboard</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 border border-border/50 shadow-xl">
            <h2 className="text-xl font-bold text-foreground mb-4">Create a Team</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Team Name</label>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Grammar Gladiators"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Description (Optional)</label>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="What's your team about?"
                  className="w-full mt-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={pending || !createName.trim()}
                className="w-full bg-primary text-white font-bold py-2 rounded-lg shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
              >
                {pending ? "Creating..." : "Create Team"}
              </button>
            </form>
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-foreground mb-4">Open Teams</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl shimmer" />)}
            </div>
          ) : teams.length === 0 ? (
            <div className="py-16 text-center glass rounded-2xl border border-dashed border-border/50">
              <p className="text-3xl mb-2">🛡️</p>
              <p className="font-semibold text-foreground">No teams yet</p>
              <p className="text-sm text-muted-foreground">Be the first to create one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div key={team.id} className="glass rounded-2xl p-5 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/30 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                      {team.name}
                      {team.memberCount >= 10 && <span className="text-[10px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase font-bold">Full</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{team.description || "No description provided."}</p>
                    <div className="flex gap-4 mt-3">
                      <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                        👥 {team.memberCount}/10 Members
                      </span>
                      <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">
                        ⚡ {team.totalXp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoin(team.id)}
                    disabled={pending || team.memberCount >= 10}
                    className="shrink-0 px-5 py-2 bg-background border border-border text-foreground text-sm font-bold rounded-xl hover:bg-muted transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Join Team
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
