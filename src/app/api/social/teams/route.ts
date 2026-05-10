// src/app/api/social/teams/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const teams = await prisma.team.findMany({
    include: {
      leader: { select: { username: true, avatarUrl: true } },
      _count: { select: { members: true } },
      members: {
        select: {
          id: true,
          leaderboard: { select: { totalXp: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const enrichedTeams = teams.map((team) => {
    const totalXp = team.members.reduce((sum, m) => sum + (m.leaderboard?.totalXp ?? 0), 0);
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      leader: team.leader,
      memberCount: team._count.members,
      totalXp,
      createdAt: team.createdAt,
    };
  });

  // Sort teams by total XP descending for the Team Leaderboard
  enrichedTeams.sort((a, b) => b.totalXp - a.totalXp);

  return NextResponse.json({ teams: enrichedTeams });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { action, name, description, teamId } = await req.json().catch(() => ({}));

  if (action === "create") {
    if (!name) return NextResponse.json({ error: "Team name required" }, { status: 400 });
    
    // Check if user is already in a team
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
    if (currentUser?.teamId) return NextResponse.json({ error: "You are already in a team" }, { status: 400 });

    try {
      const team = await prisma.team.create({
        data: {
          name,
          description,
          leaderId: userId,
          members: { connect: { id: userId } }, // Add leader as a member
        },
      });
      return NextResponse.json({ success: true, team }, { status: 201 });
    } catch (e: any) {
      if (e.code === "P2002") return NextResponse.json({ error: "Team name already taken" }, { status: 409 });
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }
  }

  if (action === "join") {
    if (!teamId) return NextResponse.json({ error: "Team ID required" }, { status: 400 });

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
    if (currentUser?.teamId) return NextResponse.json({ error: "You are already in a team" }, { status: 400 });

    const team = await prisma.team.findUnique({ where: { id: teamId }, include: { _count: { select: { members: true } } } });
    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });
    if (team._count.members >= 10) return NextResponse.json({ error: "Team is full (max 10 members)" }, { status: 403 });

    await prisma.user.update({
      where: { id: userId },
      data: { teamId },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (action === "leave") {
    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { teamId: true } });
    if (!currentUser?.teamId) return NextResponse.json({ error: "You are not in a team" }, { status: 400 });

    const team = await prisma.team.findUnique({ where: { id: currentUser.teamId } });
    if (team?.leaderId === userId) {
      // If leader leaves, delete the team or transfer leadership (simplest is delete team for now or prevent leaving)
      return NextResponse.json({ error: "Leaders cannot leave. Delete the team instead." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });
    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
