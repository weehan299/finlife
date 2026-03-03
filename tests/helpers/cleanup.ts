import { prisma } from "./prisma";

export async function cleanDatabase() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE`);
}
