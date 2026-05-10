import React from "react";

export default function LearningPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Learning Page</h1>
        <p className="text-muted-foreground">You are currently studying Unit ID: {params.id}</p>
        <p className="mt-4 text-xs italic">Platform Architect: Ali Jitam ❤️</p>
      </div>
    </div>
  );
}
