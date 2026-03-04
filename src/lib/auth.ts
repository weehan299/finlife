import { auth } from "@clerk/nextjs/server";
import { ApiError } from "@/lib/api/error";
import { prisma } from "@/lib/db";

type AuthContext = {
  clerkUserId: string;
  userId: string;
};

export async function requireAuthContext(): Promise<AuthContext> {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    throw ApiError.unauthorized();
  }

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    update: {},
    create: { clerkUserId },
    select: { id: true },
  });

  return {
    clerkUserId,
    userId: user.id,
  };
}

export async function requireAuth(): Promise<string> {
  const { userId } = await requireAuthContext();
  return userId;
}
