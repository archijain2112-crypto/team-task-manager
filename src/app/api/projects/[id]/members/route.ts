import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { email, role } = await req.json();

    if (!email || email.trim() === "") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // 1. Verify that the requester is an ADMIN of this project
    const requesterMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.userId,
          projectId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only project Admins can manage members" },
        { status: 403 }
      );
    }

    // 2. Find target user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User with this email does not exist" },
        { status: 404 }
      );
    }

    // 3. Check if user is already a member
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: targetUser.id,
          projectId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 400 }
      );
    }

    // 4. Create membership
    const memberRole = role === "ADMIN" ? "ADMIN" : "MEMBER";
    const newMember = await prisma.projectMember.create({
      data: {
        userId: targetUser.id,
        projectId,
        role: memberRole,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Member added successfully", member: newMember },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST project members error:", error);
    return NextResponse.json(
      { error: "Failed to add member" },
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

    const { id: projectId } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // 1. Verify that the requester is an ADMIN of this project
    const requesterMembership = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.userId,
          projectId,
        },
      },
    });

    if (!requesterMembership || requesterMembership.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only project Admins can manage members" },
        { status: 403 }
      );
    }

    // 2. Prevent removing the last Admin (or self if last admin)
    if (userId === session.userId) {
      // Check count of admins in the project
      const adminsCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: "ADMIN",
        },
      });

      if (adminsCount <= 1) {
        return NextResponse.json(
          { error: "Bad Request: You cannot leave the project as you are the only Admin." },
          { status: 400 }
        );
      }
    }

    // 3. Delete membership
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
    });

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error: any) {
    console.error("DELETE project member error:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
