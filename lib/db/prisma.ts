// lib/db/prisma.ts
// Singleton Prisma client — évite les connexions multiples en développement (HMR)

const prismaModuleName = "@prisma/client/default";
const { PrismaClient } = require(prismaModuleName);

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
