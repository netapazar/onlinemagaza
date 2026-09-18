import { existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@/generated/prisma/client";

// Same Vercel query-engine-path fix as magaza-crm's lib/prisma.ts (see that
// file's comment for the full story) — the generated client's own path
// resolution looks one directory too shallow at runtime on Vercel.
if (process.env.VERCEL) {
  const engineLibraryPath = join(
    process.cwd(),
    "generated/prisma/libquery_engine-rhel-openssl-3.0.x.so.node"
  );
  if (existsSync(engineLibraryPath)) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = engineLibraryPath;
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
