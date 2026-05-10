"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MaintenanceSection() {
  const [level, setLevel] = useState("1");
  const [unit, setUnit] = useState("1");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState<{ type: string; label: string } | null>(null);

  const handleDelete = async () => {
    if (!showConfirm) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch("/api/admin/words/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: showConfirm.type,
          levelNum: level,
          unitNum: unit,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully removed ${data.deletedCount} words.`);
      } else {
        toast.error(data.error || "Deletion failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsDeleting(false);
      setShowConfirm(null);
    }
  };

  return (
    <div className="glass rounded-3xl border border-border/50 overflow-hidden mt-10">
      <div className="px-6 py-4 border-b border-border/50 bg-rose-500/5">
        <h2 className="text-lg font-bold text-rose-500 flex items-center gap-2">
          <span>⚙️</span> System Maintenance
        </h2>
        <p className="text-xs text-muted-foreground mt-1 tracking-tight">Perform bulk data operations with caution.</p>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Delete All */}
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 flex flex-col justify-between gap-4 transition-all hover:border-rose-500/30 group">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Entire Database</p>
            <p className="text-sm font-bold text-foreground">Nuclear Wipe</p>
          </div>
          <button 
            onClick={() => setShowConfirm({ type: "all", label: "ENTIRE vocabulary database" })}
            className="w-full py-2 rounded-xl bg-rose-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
          >
            Delete All
          </button>
        </div>

        {/* Delete by Level */}
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 flex flex-col justify-between gap-4 transition-all hover:border-amber-500/30">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Filter by Level</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold">Level</span>
              <select 
                value={level} 
                onChange={(e) => setLevel(e.target.value)}
                className="bg-background border border-border/50 rounded-lg text-xs px-2 py-1 focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <button 
            onClick={() => setShowConfirm({ type: "level", label: `all words in Level ${level}` })}
            className="w-full py-2 rounded-xl bg-amber-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
          >
            Clear Level
          </button>
        </div>

        {/* Delete by Unit */}
        <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 flex flex-col justify-between gap-4 transition-all hover:border-amber-500/30">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Filter by Unit</p>
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Level</span>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="bg-background border border-border/50 rounded-lg text-[10px] px-2 py-0.5">
                  {[1, 2, 3, 4, 5, 6].map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Unit</span>
                <select value={unit} onChange={(e) => setUnit(e.target.value)} className="bg-background border border-border/50 rounded-lg text-[10px] px-2 py-0.5">
                  {Array.from({ length: 30 }).map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setShowConfirm({ type: "unit", label: `all words in Level ${level} Unit ${unit}` })}
            className="w-full py-2 rounded-xl border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-widest hover:bg-amber-500/5 transition-all active:scale-95"
          >
            Clear Unit
          </button>
        </div>

        {/* Info Card */}
        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col justify-center gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Security Note</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All deletions are <span className="text-foreground font-bold">permanent</span> and will remove all student progress related to those words.
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="glass w-full max-w-sm rounded-[2rem] border border-border/50 p-8 shadow-2xl scale-in-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-500 mb-6">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Final Confirmation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Are you sure you want to delete <span className="text-rose-500 font-bold underline decoration-rose-500/30 decoration-2 underline-offset-4">{showConfirm.label}</span>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 rounded-2xl bg-muted text-foreground text-sm font-bold hover:bg-muted/80 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-500/30 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? "Wiping..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
