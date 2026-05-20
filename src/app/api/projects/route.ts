import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: session.userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("GET projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Prisma transaction to create project and add current user as ADMIN
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          createdBy: session.userId,
        },
      });

      await tx.projectMember.create({
        data: {
          userId: session.userId,
          projectId: proj.id,
          role: "ADMIN",
        },
      });

      return proj;
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error("POST projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
