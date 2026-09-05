import type { Prisma, PrismaClient } from "@/generated/prisma/client";

type PrismaTransactionClient = Prisma.TransactionClient;

interface RecordAuditLogInput {
  actorProfileId: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export async function recordAuditLog(
  db: PrismaClient | PrismaTransactionClient,
  input: RecordAuditLogInput,
) {
  await db.auditLog.create({
    data: {
      actorProfileId: input.actorProfileId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
