"use client";
// =====================================================================
//  src/components/ErrorBoundary.tsx
//  Premium Error Boundary — Elite Midnight Gold
//  Designed by Ali Jitam ❤️
// =====================================================================

import React, { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 animate-fade-in px-4">
          <div className="h-20 w-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-xl">
            <svg className="h-10 w-10 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-black text-foreground mb-2">
              {this.props.fallbackTitle || "Something went wrong"}
            </h2>
            <p className="text-sm text-muted-foreground mb-1">
              An unexpected error occurred. Please try refreshing.
            </p>
            {this.state.error && (
              <p className="text-xs text-rose-400/60 font-mono mt-2 truncate max-w-sm mx-auto">
                {this.state.error.message}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 transition-all"
          >
            ↻ Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
