import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      title,
      description,
      dueDate,
      priority,
      status,
      assignedTo,
      projectId,
    } = await req.json();

    if (!title || title.trim() === "") {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // 1. Verify that the current user is a member of the target project
    const requesterMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.userId,
          projectId,
        },
      },
    });

    if (!requesterMembership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    // 2. If assignedTo is specified, verify that the assignee is a member of the project
    if (assignedTo) {
      const assigneeMembership = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: assignedTo,
            projectId,
          },
        },
      });

      if (!assigneeMembership) {
        return NextResponse.json(
          { error: "Bad Request: Assignee must be a member of this project" },
          { status: 400 }
        );
      }
    }

    // 3. Create the task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        status: status || "TODO",
        assignedTo: assignedTo || null,
        projectId,
        createdBy: session.userId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error("POST tasks error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
