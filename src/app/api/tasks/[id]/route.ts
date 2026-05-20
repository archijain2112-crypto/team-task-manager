import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify project membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.userId,
          projectId: task.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    return NextResponse.json({ task, userRole: membership.role });
  } catch (error: any) {
    console.error("GET task details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const { title, description, dueDate, priority, status, assignedTo } = body;

    // 1. Fetch existing task
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Fetch requester's project membership role
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.userId,
          projectId: task.projectId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    const isAdmin = membership.role === "ADMIN";
    const isAssignee = task.assignedTo === session.userId;

    // 3. Authorization check
    if (!isAdmin && !isAssignee) {
      return NextResponse.json(
        { error: "Forbidden: Members can only edit tasks assigned to them" },
        { status: 403 }
      );
    }

    // 4. Update data construction based on permissions
    let updateData: any = {};

    if (isAdmin) {
      // Admins can update all fields
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (priority !== undefined) updateData.priority = priority;
      if (status !== undefined) updateData.status = status;

      if (assignedTo !== undefined) {
        if (assignedTo) {
          // Verify assignee is in the project
          const assigneeMembership = await prisma.projectMember.findUnique({
            where: {
              userId_projectId: {
                userId: assignedTo,
                projectId: task.projectId,
              },
            },
          });

          if (!assigneeMembership) {
            return NextResponse.json(
              { error: "Bad Request: Assignee must be a member of the project" },
              { status: 400 }
            );
          }
          updateData.assignedTo = assignedTo;
        } else {
          updateData.assignedTo = null;
        }
      }
    } else {
      // Members can only update the status of their assigned tasks
      if (title !== undefined || description !== undefined || dueDate !== undefined || priority !== undefined || assignedTo !== undefined) {
        return NextResponse.json(
          { error: "Forbidden: Members can only update the status of their tasks" },
          { status: 403 }
        );
      }
      if (status !== undefined) {
        updateData.status = status;
      }
    }

    // 5. Commit update
    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ task: updatedTask });
  } catch (error: any) {
    console.error("PUT task error:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // 1. Fetch task
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Fetch membership role
    const membership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.userId,
          projectId: task.projectId,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only project Admins can delete tasks" },
        { status: 403 }
      );
    }

    // 3. Delete task
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("DELETE task error:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
