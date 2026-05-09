import React from "react";

export default function Leaderboard() {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-6 text-center shadow-lg">
      <h2 className="text-xl font-bold text-primary mb-4" dir="rtl">لوحة الصدارة (Leaderboard)</h2>
      <div className="flex flex-col gap-4">
        {/* Placeholder tabs */}
        <div className="flex bg-muted/50 p-1 rounded-lg">
          <button className="flex-1 py-2 text-sm font-medium bg-background shadow rounded-md text-foreground">Global</button>
          <button className="flex-1 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Friends</button>
        </div>
        
        {/* Placeholder list */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between p-3 glass rounded-lg border border-border/50">
            <span className="font-bold text-amber-500">#1</span>
            <span className="font-medium text-foreground">Student A</span>
            <span className="text-sm text-primary">1500 XP</span>
          </div>
          <div className="flex items-center justify-between p-3 glass rounded-lg border border-border/50">
            <span className="font-bold text-slate-300">#2</span>
            <span className="font-medium text-foreground">Student B</span>
            <span className="text-sm text-primary">1200 XP</span>
          </div>
          <div className="flex items-center justify-between p-3 glass rounded-lg border border-border/50">
            <span className="font-bold text-orange-400">#3</span>
            <span className="font-medium text-foreground">Student C</span>
            <span className="text-sm text-primary">950 XP</span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          Temporary Placeholder. Waiting for actual backend integration.
        </p>
      </div>
    </div>
  );
}
