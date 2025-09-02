import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function createAuditLog(userId: string | null, action: string, tableName: string, recordId: string | null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: action,
        tableName: tableName,
        recordId: recordId,
      },
    });
    console.log('Audit log created successfully:', { userId, action, tableName, recordId });
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}
