"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfileEditPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [pending, start] = useTransition();

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("Profile updated successfully!");
      router.push(`/profile/${data.user.username}`);
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in py-12">
      <div className="glass rounded-3xl border border-border/50 p-8 shadow-xl">
        <h1 className="text-2xl font-extrabold text-foreground mb-6">Edit Profile</h1>
        
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Display Name</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="New Username"
              className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
              required
              minLength={3}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase">Avatar URL (Optional)</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <p className="text-[10px] text-muted-foreground mt-2">Leave blank to use your stylish initial avatar.</p>
          </div>
          
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 bg-muted text-foreground text-sm font-bold rounded-xl hover:bg-muted/80 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 bg-primary text-white font-bold py-2.5 rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
