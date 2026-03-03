import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";

export async function requireAuth(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId: userId },
    update: {},
    create: { clerkUserId: userId },
    select: { id: true },
  });

  return user.id;
}
