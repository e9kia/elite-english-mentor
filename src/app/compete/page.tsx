import React from "react";
// Assumes Leaderboard is a default export from a social/Leaderboard component or similar.
import Leaderboard from "@/components/Leaderboard";

export const metadata = {
  title: "Compete | The Elite English Mentor",
  description: "Global and friends leaderboards",
};

import { redirect } from "next/navigation";

export default function CompetePage() {
  redirect("/leaderboard");
}
