"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn, formatBytes } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedWord {
  word: string;
  type: string;
  definition: string;
  example: string;
  level: number | string;
  unit: number | string;
  phonetic?: string;
  difficulty?: number | string;
  _row: number;
  _valid: boolean;
  _errors: string[];
}

interface ImportResult {
  batchId: string;
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: { row: number; word?: string; reason: string }[];
  durationMs: number;
  message: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WORD_TYPES = ["noun", "verb", "adjective", "adverb", "preposition", "pronoun", "conjunction", "phrase", "other"];

const COLUMN_ALIASES: Record<string, string> = {
  word: "word", vocabulary: "word", term: "word",
  type: "type", "part of speech": "type", pos: "type",
  definition: "definition", meaning: "definition",
  example: "example", sentence: "example",
  level: "level", lvl: "level",
  unit: "unit", chapter: "unit",
  phonetic: "phonetic", ipa: "phonetic",
  difficulty: "difficulty", diff: "difficulty",
};

const TYPE_VARIANT: Record<string, string> = {
  noun: "noun", verb: "verb", adjective: "adjective",
  adverb: "adverb", preposition: "preposition", pronoun: "pronoun",
  conjunction: "conjunction", phrase: "phrase", other: "other",
};

// ─── Parse helper ─────────────────────────────────────────────────────────────

function parseBuffer(buffer: ArrayBuffer, filename: string): ParsedWord[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true, raw: false });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  return raw.map((row, i) => {
    const norm: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      const alias = COLUMN_ALIASES[k.trim().toLowerCase()];
      if (alias) norm[alias] = v;
    }

    const errors: string[] = [];
    if (!norm.word) errors.push("Missing Word");
    if (!norm.type) errors.push("Missing Type");
    else if (!WORD_TYPES.includes(String(norm.type).toLowerCase())) errors.push(`Invalid Type: ${norm.type}`);
    if (!norm.definition) errors.push("Missing Definition");
    if (!norm.example) errors.push("Missing Example");
    const lvl = Number(norm.level);
    if (!norm.level || isNaN(lvl) || lvl < 1) errors.push("Level must be a positive number");
    const unt = Number(norm.unit);
    if (!norm.unit || isNaN(unt) || unt < 1) errors.push("Unit must be a positive number");

    return {
      word: String(norm.word || ""),
      type: String(norm.type || "").toLowerCase(),
      definition: String(norm.definition || ""),
      example: String(norm.example || ""),
      level: norm.level as number,
      unit: norm.unit as number,
      phonetic: norm.phonetic ? String(norm.phonetic) : undefined,
      difficulty: norm.difficulty ? Number(norm.difficulty) : 1,
      _row: i + 2,
      _valid: errors.length === 0,
      _errors: errors,
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DifficultyDots({ value }: { value: number | string }) {
  const n = Math.min(5, Math.max(1, Number(value) || 1));
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "inline-block h-1.5 w-1.5 rounded-full",
            i < n ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

function StatCard({
  label, value, sub, color,
}: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
      <p className={cn("text-2xl font-bold", color ?? "text-foreground")}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedWord[]>([]);
  const [upsert, setUpsert] = useState(false);
  const [wipe, setWipe] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [filterInvalid, setFilterInvalid] = useState(false);

  const validRows = rows.filter((r) => r._valid);
  const invalidRows = rows.filter((r) => !r._valid);
  const displayRows = filterInvalid ? invalidRows : rows;

  // ── Drop handler ──
  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setRows([]);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseBuffer(e.target!.result as ArrayBuffer, f.name);
        setRows(parsed);
        toast.success(`Parsed ${parsed.length} rows from ${f.name}`);
      } catch (err) {
        toast.error(`Failed to parse file: ${String(err)}`);
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  // ── Import handler ──
  const handleImport = async () => {
    if (!file || validRows.length === 0) return;

    setImporting(true);
    setProgress(10);
    setResult(null);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("upsertDuplicates", String(upsert));
    fd.append("wipeData", String(wipe));
    fd.append("useAI", String(useAI));

    try {
      setProgress(40);
      const res = await fetch("/api/admin/import", { method: "POST", body: fd });
      setProgress(90);
      const data: ImportResult & { error?: string } = await res.json();
      setProgress(100);

      if (!res.ok) {
        toast.error(data.error ?? "Import failed");
      } else {
        setResult(data);
        toast.success(`✅ ${data.importedCount} words imported successfully!`);
      }
    } catch (err) {
      toast.error(`Network error: ${String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => { setFile(null); setRows([]); setResult(null); setProgress(0); };

  // ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in space-y-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
              /admin/upload
            </span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Bulk Word Import</h1>
          <p className="text-muted-foreground mt-1.5 text-sm max-w-xl">
            Upload an Excel (.xlsx) or CSV file to populate the vocabulary database.
            Preview and validate before committing.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Upsert toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none glass px-4 py-2.5 rounded-xl transition-all hover:bg-muted/50">
            <input type="checkbox" checked={upsert} onChange={(e) => setUpsert(e.target.checked)} className="accent-primary" />
            <span className="text-xs font-medium text-muted-foreground">Update duplicates</span>
          </label>

          {/* Wipe toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none glass px-4 py-2.5 rounded-xl transition-all hover:bg-rose-500/5">
            <input type="checkbox" checked={wipe} onChange={(e) => setWipe(e.target.checked)} className="accent-rose-500" />
            <span className="text-xs font-medium text-rose-500/80">Wipe Data First</span>
          </label>

          {/* AI toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none glass px-4 py-2.5 rounded-xl transition-all hover:bg-primary/5">
            <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} className="accent-primary" />
            <span className="text-xs font-medium text-primary">AI Auto-Translate</span>
          </label>
        </div>
      </div>

      {/* ── Dropzone ── */}
      <div
        {...getRootProps()}
        className={cn(
          "relative rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 select-none",
          "hover:bg-primary/5",
          isDragReject
            ? "bg-rose-500/5 dropzone-border-active"
            : isDragActive
              ? "bg-primary/10 dropzone-border-active scale-[1.01]"
              : file
                ? "bg-emerald-500/5 border border-emerald-500/20"
                : "dropzone-border bg-card/40"
        )}
      >
        <input {...getInputProps()} id="file-upload" />

        {/* Icon */}
        <div className={cn(
          "mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300",
          isDragActive ? "bg-primary/20 scale-110" : file ? "bg-emerald-500/20" : "bg-muted"
        )}>
          {file ? (
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className={cn("h-7 w-7 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
        </div>

        {file ? (
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{file.name}</p>
            <p className="text-sm text-muted-foreground">{formatBytes(file.size)}</p>
            <button
              onClick={(e) => { e.stopPropagation(); reset(); }}
              className="mt-3 text-xs text-rose-400 hover:text-rose-300 underline underline-offset-2"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              {isDragActive ? "Release to load file" : "Drag & drop your file here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or{" "}
              <span className="text-primary hover:underline font-medium">browse</span>
              {" "}to choose
            </p>
            <p className="text-xs text-muted-foreground/60 mt-3">
              Accepts .xlsx · .xls · .csv — max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* ── Format guide (shown before file is loaded) ── */}
      {!file && (
        <div className="glass rounded-xl p-5 animate-slide-up">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Required column headers
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { col: "Word", aliases: "Vocabulary, Term", required: true },
              { col: "Type", aliases: "POS, Part of Speech", required: true },
              { col: "Definition", aliases: "Meaning, Description", required: true },
              { col: "Example", aliases: "Sentence, Usage", required: true },
              { col: "Level", aliases: "Lvl  (1–6)", required: true },
              { col: "Unit", aliases: "Chapter  (1–30)", required: true },
              { col: "Phonetic", aliases: "IPA, Pronunciation", required: false },
              { col: "Difficulty", aliases: "Diff  (1–5)", required: false },
            ].map((h) => (
              <div key={h.col}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs border",
                  h.required
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                <span className="font-mono font-semibold">{h.col}</span>
                <span className="opacity-60">—</span>
                <span>{h.aliases}</span>
                {!h.required && (
                  <span className="ml-1 text-[10px] opacity-50">optional</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats cards (after parse) ── */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 animate-slide-up">
          <StatCard label="Total Rows" value={rows.length} color="text-foreground" />
          <StatCard label="Valid" value={validRows.length} color="text-emerald-400"
            sub={`${Math.round((validRows.length / rows.length) * 100)}% ready`} />
          <StatCard label="Invalid" value={invalidRows.length} color={invalidRows.length > 0 ? "text-rose-400" : "text-muted-foreground"} />
          <StatCard label="Unique Types" value={Array.from(new Set(validRows.map(r => r.type))).length}
            sub={Array.from(new Set(validRows.map(r => r.type))).join(", ")} />
        </div>
      )}

      {/* ── Preview Table ── */}
      {rows.length > 0 && (
        <div className="animate-slide-up space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 10h18M3 14h18M10 3v18M14 3v18" />
              </svg>
              Preview
              <span className="text-xs font-normal text-muted-foreground">
                ({displayRows.length} rows shown)
              </span>
            </h2>

            {/* Filter toggle */}
            {invalidRows.length > 0 && (
              <button
                onClick={() => setFilterInvalid(!filterInvalid)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-lg border transition-colors",
                  filterInvalid
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {filterInvalid ? `Show all (${rows.length})` : `Show errors only (${invalidRows.length})`}
              </button>
            )}
          </div>

          <div className="glass rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    {["#", "Word", "Type", "Definition", "Example", "L", "U", "IPA", "Diff", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "border-b border-border/30 transition-colors hover:bg-muted/20",
                        !row._valid && "bg-rose-500/5"
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{row._row}</td>

                      <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">{row.word || "—"}</td>

                      <td className="px-4 py-3">
                        {row.type ? (
                          <Badge variant={(TYPE_VARIANT[row.type] ?? "other") as any}>
                            {row.type}
                          </Badge>
                        ) : (
                          <Badge variant="error">missing</Badge>
                        )}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground max-w-xs">
                        <span className="line-clamp-2">{row.definition || "—"}</span>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground max-w-xs">
                        <span className="line-clamp-2 italic">{row.example || "—"}</span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono text-xs text-foreground">{row.level}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs text-foreground">{row.unit}</td>

                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground/70 whitespace-nowrap">
                        {row.phonetic || "—"}
                      </td>

                      <td className="px-4 py-3">
                        <DifficultyDots value={row.difficulty ?? 1} />
                      </td>

                      <td className="px-4 py-3">
                        {row._valid ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            OK
                          </span>
                        ) : (
                          <div className="group relative">
                            <span className="inline-flex items-center gap-1 text-xs text-rose-400 cursor-help">
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Error
                            </span>
                            <div className="absolute right-0 bottom-6 z-10 hidden group-hover:block w-52 rounded-lg bg-card border border-border shadow-xl p-2.5 text-xs text-muted-foreground">
                              {row._errors.map((e, j) => (
                                <p key={j} className="flex gap-1.5 items-start">
                                  <span className="text-rose-400 mt-0.5">•</span>{e}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Action Bar ── */}
      {rows.length > 0 && !result && (
        <div className="animate-slide-up glass rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              Ready to import <span className="text-primary font-bold">{validRows.length}</span> words
              {invalidRows.length > 0 && (
                <span className="text-rose-400">
                  {" "}({invalidRows.length} rows will be skipped)
                </span>
              )}
            </p>
            {upsert && (
              <p className="text-xs text-amber-400 mt-0.5">
                ⚠ Update mode: existing words in the same unit will be overwritten
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={reset} disabled={importing}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="min-w-[140px]"
            >
              {importing ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Importing…
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Words
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Progress bar ── */}
      {importing && (
        <div className="space-y-2 animate-fade-in">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading to server…</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* ── Result summary ── */}
      {result && (
        <div className={cn(
          "animate-slide-up rounded-xl border p-6 space-y-4",
          result.errorCount === 0
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-amber-500/5 border-amber-500/20"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              result.errorCount === 0 ? "bg-emerald-500/20" : "bg-amber-500/20"
            )}>
              {result.errorCount === 0 ? (
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold text-foreground">{result.message}</p>
              <p className="text-xs text-muted-foreground">Batch ID: <span className="font-mono">{result.batchId}</span> · {result.durationMs}ms</p>
            </div>
            <Button variant="outline" size="sm" className="ml-auto" onClick={reset}>
              Import another file
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Imported" value={result.importedCount} color="text-emerald-400" />
            <StatCard label="Skipped/Errs" value={result.errorCount} color={result.errorCount > 0 ? "text-amber-400" : "text-muted-foreground"} />
            <StatCard label="Total Rows" value={result.totalRows} />
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-lg bg-card/60 border border-border/50 overflow-hidden">
              <p className="px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
                Row errors
              </p>
              <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
                {result.errors.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="font-mono text-xs text-muted-foreground mt-0.5 w-12 shrink-0">Row {e.row}</span>
                    {e.word && <span className="text-xs font-semibold text-foreground w-28 shrink-0">{e.word}</span>}
                    <span className="text-xs text-rose-400">{e.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
