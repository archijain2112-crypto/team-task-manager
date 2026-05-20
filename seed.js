const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clean existing data
  console.log("Cleaning existing collections...");
  try {
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (e) {
    console.log("Note: Collections didn't exist or clean skipped:", e.message);
  }

  // 2. Hash passwords
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Create Users
  console.log("Creating default users...");
  const admin = await prisma.user.create({
    data: {
      name: "Alex Rivera",
      email: "admin@example.com",
      password: hashedPassword,
    },
  });

  const member = await prisma.user.create({
    data: {
      name: "Jamie Chen",
      email: "member@example.com",
      password: hashedPassword,
    },
  });

  console.log(`- Created Admin User: ${admin.email}`);
  console.log(`- Created Member User: ${member.email}`);

  // 4. Create Project
  console.log("Creating default project...");
  const project = await prisma.project.create({
    data: {
      name: "Alpha Release Sprint",
      description: "Coordination workspace for the upcoming Alpha v1.0 web application launch.",
      createdBy: admin.id,
    },
  });

  // 5. Add members to Project
  console.log("Adding members to project...");
  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: admin.id,
      role: "ADMIN",
    },
  });

  await prisma.projectMember.create({
    data: {
      projectId: project.id,
      userId: member.id,
      role: "MEMBER",
    },
  });

  // 6. Create Tasks
  console.log("Creating tasks...");
  const now = new Date();

  // Task 1: Completed Task
  await prisma.task.create({
    data: {
      title: "Set up Prisma 7 schemas & Mongo DB connection",
      description: "Define MongoDB data models, instantiate DB client helper, and generate Prisma typings.",
      status: "DONE",
      priority: "HIGH",
      projectId: project.id,
      assignedTo: admin.id,
      createdBy: admin.id,
      dueDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    },
  });

  // Task 2: In Progress Task
  await prisma.task.create({
    data: {
      title: "Build REST endpoint aggregates `/api/dashboard`",
      description: "Develop the dashboard statistics endpoint summarizing project metrics and tasks by status.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: project.id,
      assignedTo: member.id,
      createdBy: admin.id,
      dueDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day in future
    },
  });

  // Task 3: Todo Task (Unassigned)
  await prisma.task.create({
    data: {
      title: "Assemble modern glassmorphism Sidebar",
      description: "Design a slick Obsidian dark-themed collapsible sidebar navigation for active project paths.",
      status: "TODO",
      priority: "MEDIUM",
      projectId: project.id,
      createdBy: admin.id,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
    },
  });

  // Task 4: Overdue Task
  await prisma.task.create({
    data: {
      title: "Add member invite restriction validation rules",
      description: "Enforce project invitation rules ensuring only project admins can manage members.",
      status: "TODO",
      priority: "HIGH",
      projectId: project.id,
      assignedTo: member.id,
      createdBy: admin.id,
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day in past (Overdue!)
    },
  });

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
