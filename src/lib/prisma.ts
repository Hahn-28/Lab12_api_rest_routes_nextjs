import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
});

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

// Manejo de desconexión graceful para bases de datos en la nube
if (typeof window === "undefined") {
    process.on("beforeExit", async () => {
        await prisma.$disconnect();
    });
}