"use client";
// src/app/(auth)/signup/page.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn }    from "next-auth/react";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirm) { setError("Passwords don't match."); return; }
    if (form.password.length < 8)       { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed"); return; }

      // Auto sign-in after registration
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (result?.ok) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    "w-full h-11 px-4 rounded-xl border bg-muted/40 text-foreground placeholder-muted-foreground",
    "border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
    "transition-colors text-sm"
  );

  const pwStrength = form.password.length === 0 ? 0
    : form.password.length < 8 ? 1
    : /[A-Z]/.test(form.password) && /[0-9]/.test(form.password) ? 3 : 2;

  const strengthColors = ["", "bg-rose-500", "bg-amber-500", "bg-emerald-500"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <div className="glass rounded-2xl border border-border/50 p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
        <p className="text-muted-foreground text-sm mt-1">Free forever · No credit card required</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-sm text-rose-300">
          <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="username">Username</label>
          <input id="username" type="text" value={form.username} onChange={update("username")}
            placeholder="scholar_42" required minLength={3} maxLength={20} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={update("email")}
            placeholder="you@example.com" required className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" type={showPw ? "text" : "password"} value={form.password}
              onChange={update("password")} placeholder="Min. 8 characters" required minLength={8}
              className={cn(inputClass, "pr-11")} />
            <button type="button" onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={showPw ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
              </svg>
            </button>
          </div>
          {/* Strength bar */}
          {form.password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3].map((i) => (
                  <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300",
                    i <= pwStrength ? strengthColors[pwStrength] : "bg-muted")} />
                ))}
              </div>
              <p className={cn("text-xs", pwStrength === 1 ? "text-rose-400" : pwStrength === 2 ? "text-amber-400" : "text-emerald-400")}>
                {strengthLabels[pwStrength]}
              </p>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirm">Confirm Password</label>
          <input id="confirm" type="password" value={form.confirm} onChange={update("confirm")}
            placeholder="••••••••" required className={cn(inputClass,
              form.confirm && form.confirm !== form.password && "border-rose-500/50 focus:ring-rose-500/50")} />
        </div>
        <button type="submit" disabled={loading}
          className={cn(
            "w-full h-11 rounded-xl font-semibold text-sm transition-all duration-200 mt-2",
            "bg-primary text-white shadow-lg shadow-primary/30",
            "hover:bg-primary/90 hover:-translate-y-0.5 active:scale-95",
            "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          )}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Creating account…
            </span>
          ) : "Create Account →"}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="text-primary font-medium hover:underline underline-offset-2">Sign in</a>
      </div>
    </div>
  );
}
