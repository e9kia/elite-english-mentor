"use client";
// =====================================================================
//  src/app/(admin)/admin/words/page.tsx
//  Unified Word Management & CSV Importer
//  Elite Midnight Gold · Designed by Ali Jitam ❤️
// =====================================================================

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────

interface Word {
  id: string; word: string; type: string; definition: string; example: string;
  meaningArabic: string; typeArabic: string; sentenceArabic: string;
  difficulty: number; phonetic: string | null; unit: { number: number; level: { number: number } };
}

// ── Components ───────────────────────────────────────────────────────

export default function UnifiedWordsPage() {
  const [activeTab, setActiveTab] = useState<"list" | "import">("list");

  // LIST STATE
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;
  const [isPending, start] = useTransition();

  // UPLOAD STATE
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  // ── 1. Fetch Words ─────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/words")
      .then((r) => r.json())
      .then((d) => setWords(d.words ?? []))
      .catch(() => toast.error("Failed to load words"))
      .finally(() => setLoading(false));
  }, [activeTab]); // re-fetch when switching to list

  // ── 2. Import Logic ────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upsertDuplicates", "true");

    try {
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Import failed");
      
      setResult(data);
      toast.success(`Successfully imported ${data.importedCount} words! 🚀`);
      setFile(null); // clear file to allow re-upload
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const deleteWord = useCallback((id: string, wordText: string) => {
    if (!confirm(`Delete "${wordText}"? This cannot be undone.`)) return;
    start(async () => {
      await fetch(`/api/admin/words/${id}`, { method: "DELETE" });
      setWords((ws) => ws.filter((w) => w.id !== id));
      toast.success(`"${wordText}" deleted`);
    });
  }, []);

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    (w.definition || "").toLowerCase().includes(search.toLowerCase()) ||
    (w.meaningArabic || "").includes(search)
  );
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black gradient-text tracking-tighter">Word Management</h1>
          <p className="text-muted-foreground mt-1 font-medium">{words.length} vocabulary words in the database.</p>
        </div>
        <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
          <button onClick={() => setActiveTab("list")} className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "list" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}>Word List</button>
          <button onClick={() => setActiveTab("import")} className={cn("px-6 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "import" ? "bg-gold text-gold-foreground shadow-lg" : "text-muted-foreground hover:text-foreground")}>Bulk Importer</button>
        </div>
      </div>

      {/* IMPORT TAB */}
      {activeTab === "import" && (
        <div className="elite-card p-8 rounded-3xl border border-gold/20 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-foreground">Bulk CSV Injection</h2>
            <p className="text-sm text-muted-foreground">Upload your enriched CSV mapping exactly to the Elite schema.</p>
          </div>

          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
              isDragActive ? "bg-gold/10 border-gold shadow-[0_0_30px_hsl(var(--gold)/0.2)]" : file ? "bg-emerald-500/5 border-emerald-500/30" : "bg-card border-border/50 hover:bg-muted/30 hover:border-gold/30"
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-2">
                <span className="text-4xl">📄</span>
                <p className="font-bold text-lg text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </div>
                <p className="text-lg font-bold text-foreground">Drag & Drop CSV / Excel File</p>
                <p className="text-sm text-muted-foreground">Includes: word, type, definition, example, meaningArabic, typeArabic, sentenceArabic...</p>
              </div>
            )}
          </div>

          {file && (
            <div className="flex justify-end gap-3">
              <button onClick={() => setFile(null)} className="px-6 py-3 rounded-xl border border-border font-bold hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleImport} disabled={importing} className="px-8 py-3 rounded-xl bg-gold text-gold-foreground font-black shadow-lg shadow-gold/20 hover:scale-105 transition-all disabled:opacity-50">
                {importing ? "Injecting Data..." : "Run Bulk Upsert"}
              </button>
            </div>
          )}

          {result && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-emerald-500">
              <h3 className="font-black text-lg mb-2">Import Successful!</h3>
              <p className="font-medium text-sm text-emerald-500/80">Imported {result.importedCount} words. {result.errorCount > 0 ? `${result.errorCount} errors skipped.` : 'Zero errors.'}</p>
            </div>
          )}
        </div>
      )}

      {/* LIST TAB */}
      {activeTab === "list" && (
        <div className="space-y-4">
          <div className="glass rounded-xl border border-border/50 flex items-center gap-3 px-4 py-3">
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search words or definitions…" className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none" />
          </div>

          <div className="glass rounded-2xl border border-border/50 overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />)}</div>
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground font-bold text-lg">No words found in database.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border/50">
                      <th className="text-left px-5 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Word</th>
                      <th className="text-left px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Type</th>
                      <th className="text-left px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Meaning (AR)</th>
                      <th className="text-center px-4 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Unit</th>
                      <th className="text-right px-5 py-4 text-xs font-black text-muted-foreground uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {paginated.map((w) => (
                      <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-black text-foreground text-base">{w.word}</td>
                        <td className="px-4 py-4 hidden sm:table-cell"><span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded uppercase">{w.type}</span></td>
                        <td className="px-4 py-4 text-muted-foreground font-medium" dir="rtl">{w.meaningArabic}</td>
                        <td className="px-4 py-4 text-center font-bold text-muted-foreground/60 hidden lg:table-cell">L{w.unit?.level?.number} · U{w.unit?.number}</td>
                        <td className="px-5 py-4 text-right">
                          <button onClick={() => deleteWord(w.id, w.word)} className="text-rose-500/50 hover:text-rose-500 font-black text-xs uppercase tracking-widest transition-colors">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-border/50 flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground">Showing {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="text-xs font-bold px-3 py-1.5 rounded bg-muted/50 hover:bg-muted disabled:opacity-40 transition-colors">Prev</button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages} className="text-xs font-bold px-3 py-1.5 rounded bg-muted/50 hover:bg-muted disabled:opacity-40 transition-colors">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
