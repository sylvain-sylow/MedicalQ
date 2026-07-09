// lib/db/prisma.ts
// Singleton Prisma client — évite les connexions multiples en développement (HMR)

// Import statique (et non `require(variable)`) : Turbopack (Next 16) ne sait pas
// résoudre un require dynamique de `@prisma/client` et fabrique un nom de module
// haché introuvable → 500 sur toutes les routes DB. L'import statique corrige cela.
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type PrismaClientType = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType };

// Prisma 7 a supprimé le moteur Rust : un driver adapter est OBLIGATOIRE.
// On branche l'adapter Postgres (pg) sur DATABASE_URL.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma: PrismaClientType =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
