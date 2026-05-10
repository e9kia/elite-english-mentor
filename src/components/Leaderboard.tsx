import React from "react";

export default function Leaderboard() {
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-border/40 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      
      <div className="relative z-10">
        <h2 className="text-2xl font-extrabold text-foreground mb-6" dir="rtl">لوحة الصدارة</h2>
        
        <div className="flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex bg-muted/30 p-1.5 rounded-xl border border-border/50">
            <button className="flex-1 py-2.5 text-sm font-bold bg-background shadow-md rounded-lg text-foreground transition-all">Global</button>
            <button className="flex-1 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all">Friends</button>
          </div>
          
          {/* List */}
          <div className="space-y-3 mt-4">
            {[
              { rank: 1, name: "Student A", xp: 1500, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
              { rank: 2, name: "Student B", xp: 1200, color: "text-slate-300", bg: "bg-slate-300/10 border-slate-300/20" },
              { rank: 3, name: "Student C", xp: 950,  color: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/20" },
            ].map((user) => (
              <div key={user.rank} className="flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 hover:bg-muted/20 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.bg} ${user.color}`}>
                    #{user.rank}
                  </div>
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{user.name}</span>
                </div>
                <span className="text-sm font-bold text-primary px-3 py-1 bg-primary/10 rounded-full">⚡ {user.xp} XP</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Waiting for live multiplayer backend integration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
