import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all projects the user is part of
    const userProjects = await prisma.projectMember.findMany({
      where: { userId: session.userId },
      select: { projectId: true },
    });

    const projectIds = userProjects.map((p) => p.projectId);

    if (projectIds.length === 0) {
      return NextResponse.json({
        totalTasks: 0,
        statusCounts: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
        priorityCounts: { LOW: 0, MEDIUM: 0, HIGH: 0 },
        overdueCount: 0,
        tasksPerUser: [],
        recentTasks: [],
      });
    }

    // 2. Fetch all tasks within these projects
    const tasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalTasks = tasks.length;

    // 3. Compile metrics
    const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0 };
    let overdueCount = 0;
    const now = new Date();

    const userTaskMap: Record<string, { name: string; count: number }> = {};

    tasks.forEach((task) => {
      // Status Counts
      if (task.status in statusCounts) {
        statusCounts[task.status as keyof typeof statusCounts]++;
      }

      // Priority Counts
      if (task.priority in priorityCounts) {
        priorityCounts[task.priority as keyof typeof priorityCounts]++;
      }

      // Overdue Counts
      if (
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== "DONE"
      ) {
        overdueCount++;
      }

      // Tasks per User
      if (task.assignee) {
        const userId = task.assignee.id;
        if (!userTaskMap[userId]) {
          userTaskMap[userId] = { name: task.assignee.name, count: 0 };
        }
        userTaskMap[userId].count++;
      } else {
        const unassignedKey = "unassigned";
        if (!userTaskMap[unassignedKey]) {
          userTaskMap[unassignedKey] = { name: "Unassigned", count: 0 };
        }
        userTaskMap[unassignedKey].count++;
      }
    });

    // Format tasks per user for Recharts
    const tasksPerUser = Object.values(userTaskMap).sort(
      (a, b) => b.count - a.count
    );

    // Get 5 most recent tasks
    const recentTasks = [...tasks]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return NextResponse.json({
      totalTasks,
      statusCounts,
      priorityCounts,
      overdueCount,
      tasksPerUser,
      recentTasks,
    });
  } catch (error: any) {
    console.error("GET dashboard metrics error:", error);
    return NextResponse.json(
      { error: "Failed to compile dashboard metrics" },
      { status: 500 }
    );
  }
}
