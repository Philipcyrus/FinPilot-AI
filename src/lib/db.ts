import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** Safe JSON parse for String-backed JSON columns. */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function jsonField(value: unknown): string {
  return JSON.stringify(value ?? null);
}

/**
 * Resolve the active (demo) user. This is a single-user local app; the first
 * user is always the demo user created by the seed script.
 */
export async function getActiveUser() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  return user;
}

export async function requireActiveUserId(): Promise<string> {
  const user = await getActiveUser();
  if (!user) throw new Error("No user found. Run `npm run db:seed`.");
  return user.id;
}
