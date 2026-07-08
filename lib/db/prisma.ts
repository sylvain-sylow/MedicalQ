// lib/db/prisma.ts
// Singleton Prisma client — évite les connexions multiples en développement (HMR)

const prismaModuleName = "@prisma/client/default";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require(prismaModuleName);
type PrismaClientType = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType };

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
export const prisma: PrismaClientType =
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
