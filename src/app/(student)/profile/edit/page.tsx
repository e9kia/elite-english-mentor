"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [xp, setXp] = useState(0);
  const [wordsMastered, setWordsMastered] = useState(0);
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);

  // Fetch current profile data on mount
  useEffect(() => {
    if (session?.user?.username) {
      setUsername(session.user.username);
      setAvatarUrl((session.user as any).image || "");
    }
    // Fetch XP stats
    fetch("/api/student/progress").then(r => r.json()).then(data => {
      setLoaded(true);
    }).catch(() => setLoaded(true));

    // Fetch leaderboard XP if available
    if (session?.user?.username) {
      fetch(`/api/social/friends`).catch(() => {});
    }
  }, [session]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatarUrl: avatarUrl || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Profile updated successfully! ✨");
      router.push(`/profile/${data.user.username}`);
    });
  };

  const initials = username?.[0]?.toUpperCase() || "U";

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in py-12">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="h-px w-12 bg-gold/30" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold">Profile Settings</span>
          <span className="h-px w-12 bg-gold/30" />
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tighter">Edit Your <span className="text-primary italic">Identity</span></h1>
        <p className="text-sm text-muted-foreground font-medium">Personalize your Elite English Mentor profile</p>
      </div>

      <div className="elite-card rounded-[2.5rem] border border-gold/10 p-8 md:p-10 shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/5 blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-gold/5 blur-[50px] pointer-events-none" />

        {/* Avatar Preview */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="h-28 w-28 rounded-[2rem] object-cover border-4 border-background shadow-xl transition-transform group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-primary/30 to-gold/30 border-4 border-background shadow-xl flex items-center justify-center text-5xl font-black text-foreground transition-transform group-hover:scale-105">
                {initials}
              </div>
            )}
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center text-sm">
              ✏️
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-bold">Live Preview</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6 relative">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gold/70 uppercase tracking-widest">Display Name</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-3.5 text-sm text-foreground font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all placeholder:text-muted-foreground/40"
              required
              minLength={3}
            />
            <p className="text-[10px] text-muted-foreground font-medium">Min 3 characters. This is your public identity.</p>
          </div>

          {/* Avatar URL */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gold/70 uppercase tracking-widest">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/your-avatar.jpg"
              className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-3.5 text-sm text-foreground font-semibold focus:ring-2 focus:ring-primary/30 focus:border-primary/40 outline-none transition-all placeholder:text-muted-foreground/40"
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              Paste an image URL. Leave blank for a stylish initial avatar.
            </p>
          </div>

          {/* XP Level Display */}
          <div className="elite-card rounded-2xl border border-border/30 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gold/60 uppercase tracking-widest">Your Status</span>
              <span className="text-xs font-bold text-primary">⚡ {session?.user?.username || "Scholar"}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background/40 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-gold">🏆</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Elite Member</p>
              </div>
              <div className="bg-background/40 rounded-xl p-3 text-center">
                <p className="text-xl font-black text-primary">📚</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Active Learner</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-3 bg-muted/50 text-foreground text-sm font-bold rounded-2xl hover:bg-muted/80 transition-all border border-border/30 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition-all active:scale-95",
                "bg-gradient-to-r from-primary to-emerald-600 text-white shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 border border-primary/30",
                pending && "opacity-50 cursor-not-allowed"
              )}
            >
              {pending ? "Saving..." : "✨ Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
