import { auth, currentUser } from "@clerk/nextjs/server";
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

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? null;

  const user = await prisma.user.upsert({
    where: { clerkUserId },
    update: { email },
    create: { clerkUserId, email },
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
