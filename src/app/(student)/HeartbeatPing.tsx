"use client";

import { useEffect } from "react";

export default function HeartbeatPing() {
  useEffect(() => {
    // Fire immediately on mount
    fetch("/api/student/heartbeat", { method: "POST" }).catch(() => {});

    // Then every 2 minutes
    const interval = setInterval(() => {
      fetch("/api/student/heartbeat", { method: "POST" }).catch(() => {});
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null; // Invisible component
}
