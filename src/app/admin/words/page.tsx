"use client";
// src/app/admin/words/page.tsx — Word Management with inline edit/delete

import { useState, useEffect, useTransition, useCallback } from "react";
import { toast } from "sonner";
import { cn }    from "@/lib/utils";

interface Word {
  id: string; word: string; type: string; definition: string;
  example: string; phonetic: string | null; difficulty: number;
  unit: { number: number; level: { number: number } };
}

const TYPES = ["noun","verb","adjective","adverb","phrase","other"] as const;

function DifficultyPips({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <div key={i} className={cn("h-1.5 w-1.5 rounded-full", i <= value ? "bg-primary" : "bg-muted")} />
      ))}
    </div>
  );
}

export default function WordManagementPage() {
  const [words,   setWords]   = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [editId,  setEditId]  = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Word>>({});
  const [isPending, start]    = useTransition();
  const [page, setPage]       = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    fetch("/api/admin/words")
      .then((r) => r.json())
      .then((d) => setWords(d.words ?? []))
      .catch(() => toast.error("Failed to load words"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.definition.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const startEdit = (w: Word) => {
    setEditId(w.id);
    setEditForm({ word: w.word, type: w.type, definition: w.definition, example: w.example, phonetic: w.phonetic, difficulty: w.difficulty });
  };

  const saveEdit = useCallback(() => {
    if (!editId) return;
    start(async () => {
      const r = await fetch(`/api/admin/words/${editId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error); return; }
      setWords((ws) => ws.map((w) => w.id === editId ? { ...w, ...d.word } : w));
      setEditId(null);
      toast.success("Word updated ✓");
    });
  }, [editId, editForm]);

  const deleteWord = useCallback((id: string, wordText: string) => {
    if (!confirm(`Delete "${wordText}"? This cannot be undone.`)) return;
    start(async () => {
      await fetch(`/api/admin/words/${id}`, { method: "DELETE" });
      setWords((ws) => ws.filter((w) => w.id !== id));
      toast.success(`"${wordText}" deleted`);
    });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Word Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{words.length} total words · Edit or delete inline</p>
        </div>
        <a href="/admin/upload" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 self-start sm:self-auto">
          📤 Import More
        </a>
      </div>

      {/* Search */}
      <div className="glass rounded-xl border border-border/50 flex items-center gap-3 px-4 py-3">
        <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search words or definitions…"
          className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none" />
        {search && <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground text-xs">✕</button>}
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-border/50 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl shimmer" />)}</div>
        ) : paginated.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-2xl mb-2">📭</p>
            <p>{search ? `No words matching "${search}"` : "No words imported yet"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/20">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Word</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Definition</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Diff</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Unit</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {paginated.map((w) => editId === w.id ? (
                  // Inline edit row
                  <tr key={w.id} className="bg-primary/5 border-l-2 border-primary">
                    <td className="px-4 py-3" colSpan={6}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Word</label>
                          <input value={editForm.word ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, word: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                          <select value={editForm.type ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none">
                            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-muted-foreground mb-1 block">Definition</label>
                          <input value={editForm.definition ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, definition: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-muted-foreground mb-1 block">Example</label>
                          <input value={editForm.example ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, example: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Phonetic (IPA)</label>
                          <input value={editForm.phonetic ?? ""} onChange={(e) => setEditForm((f) => ({ ...f, phonetic: e.target.value }))}
                            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none font-mono" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Difficulty (1–5)</label>
                          <input type="number" min={1} max={5} value={editForm.difficulty ?? 1}
                            onChange={(e) => setEditForm((f) => ({ ...f, difficulty: parseInt(e.target.value) }))}
                            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} disabled={isPending}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                          {isPending ? "Saving…" : "Save Changes"}
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="px-4 py-2 border border-border text-muted-foreground rounded-lg text-sm hover:bg-muted transition-colors">
                          Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  // Normal row
                  <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3 font-semibold text-foreground">{w.word}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground font-mono">{w.type}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs">
                      <p className="truncate">{w.definition}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><DifficultyPips value={w.difficulty} /></td>
                    <td className="px-4 py-3 text-center text-xs text-muted-foreground hidden lg:table-cell">
                      L{w.unit?.level?.number}·U{w.unit?.number}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(w)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                          ✏️ Edit
                        </button>
                        <button onClick={() => deleteWord(w.id, w.word)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-border/50 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors">
                ← Prev
              </button>
              <span className="text-xs text-muted-foreground px-2 py-1.5">{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
                className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
