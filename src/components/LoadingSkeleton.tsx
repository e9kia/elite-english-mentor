// =====================================================================
//  src/components/LoadingSkeleton.tsx
//  Premium loading skeletons — Elite Midnight Gold
//  Designed by Ali Jitam ❤️
// =====================================================================

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero skeleton */}
      <div className="h-64 rounded-[3rem] shimmer" />
      {/* Level cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-56 rounded-[2rem] shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  );
}

export function LevelViewSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-16 w-64 rounded-2xl shimmer" />
      <div className="h-12 w-full rounded-xl shimmer" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-20 rounded-2xl shimmer" style={{ animationDelay: `${i * 0.06}s` }} />
        ))}
      </div>
    </div>
  );
}

export function FlashcardSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 animate-fade-in">
      <div className="w-full max-w-2xl space-y-3">
        <div className="h-4 rounded-full shimmer" />
        <div className="h-2.5 rounded-full shimmer" />
      </div>
      <div className="w-full max-w-2xl h-[420px] rounded-[3rem] shimmer" />
      <div className="w-full max-w-2xl grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl shimmer" />
        ))}
      </div>
    </div>
  );
}

export function WordBankSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div key={i} className="h-14 rounded-xl shimmer" style={{ animationDelay: `${i * 0.04}s` }} />
      ))}
    </div>
  );
}
