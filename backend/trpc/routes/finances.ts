import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery } from "@/lib/db";

function decodeToken(token: string): { id: string; email: string; role: string; exp: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (!decoded.id || !decoded.email || !decoded.role || !decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

function escapeSQL(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function validateToken(token: string): { id: string; email: string; role: string } {
  const decoded = decodeToken(token);
  if (!decoded) {
    throw new Error("Geçersiz oturum bilgisi");
  }
  if (decoded.exp < Date.now()) {
    throw new Error("Oturum süresi dolmuş");
  }
  return decoded;
}

interface CommissionRecord {
  id: string;
  ambassador_id: string;
  student_id: string;
  program: string;
  amount_usd: number;
  stage: string;
  status: string;
  created_at: string;
}

interface TransactionRecord {
  id: string;
  ambassador_id: string;
  type: string;
  amount_usd: number;
  amount_try: number;
  description: string;
  student_id: string | null;
  student_name: string | null;
  status: string;
  created_at: string;
}

interface WithdrawalRecord {
  id: string;
  amount_usd: number;
  status: string;
}

interface ProgramRecord {
  id: string;
  name: string;
  name_en: string;
}

export const financesRouter = createTRPCRouter({
  getOverview: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Finances] getOverview called");
      const { id } = validateToken(input.token);

      const commissions = await dbQuery<CommissionRecord>(
        `SELECT * FROM commissions WHERE ambassador_id = '${escapeSQL(id)}';`
      );

      let totalEarnedUSD = 0;
      let totalPendingUSD = 0;
      let thisMonthEarnedUSD = 0;

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      for (const c of commissions) {
        if (c.status === "completed" || c.status === "paid") {
          totalEarnedUSD += c.amount_usd;
          if (c.created_at >= monthStart) {
            thisMonthEarnedUSD += c.amount_usd;
          }
        } else if (c.status === "pending") {
          totalPendingUSD += c.amount_usd;
        }
      }

      const withdrawals = await dbQuery<WithdrawalRecord>(
        `SELECT * FROM withdrawal_requests WHERE ambassador_id = '${escapeSQL(id)}' AND (status = 'completed' OR status = 'pending' OR status = 'approved');`
      );

      let totalWithdrawn = 0;
      for (const w of withdrawals) {
        totalWithdrawn += w.amount_usd;
      }

      const availableUSD = Math.max(0, totalEarnedUSD - totalWithdrawn);

      console.log("[Finances] Overview:", { totalEarnedUSD, totalPendingUSD, availableUSD, thisMonthEarnedUSD });

      return {
        totalEarnedUSD,
        totalPendingUSD,
        availableUSD,
        thisMonthEarnedUSD,
      };
    }),

  getTransactions: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Finances] getTransactions called");
      const { id } = validateToken(input.token);

      const transactions = await dbQuery<TransactionRecord>(
        `SELECT * FROM transactions WHERE ambassador_id = '${escapeSQL(id)}' ORDER BY created_at DESC;`
      );

      const commissions = await dbQuery<CommissionRecord>(
        `SELECT * FROM commissions WHERE ambassador_id = '${escapeSQL(id)}' ORDER BY created_at DESC;`
      );

      const result: {
        id: string;
        type: string;
        amountUSD: number;
        amountTRY: number;
        description: string;
        studentName: string | null;
        studentId: string | null;
        status: string;
        createdAt: string;
      }[] = [];

      for (const t of transactions) {
        result.push({
          id: t.id,
          type: t.type,
          amountUSD: t.amount_usd,
          amountTRY: t.amount_try,
          description: t.description,
          studentName: t.student_name,
          studentId: t.student_id,
          status: t.status,
          createdAt: t.created_at,
        });
      }

      for (const c of commissions) {
        const alreadyInTx = result.some(
          (r) => r.studentId === c.student_id && r.type === `student_${c.stage}`
        );
        if (!alreadyInTx) {
          result.push({
            id: c.id,
            type: `student_${c.stage}`,
            amountUSD: c.amount_usd,
            amountTRY: 0,
            description: `Komisyon - ${c.stage} aşaması`,
            studentName: null,
            studentId: c.student_id,
            status: c.status,
            createdAt: c.created_at,
          });
        }
      }

      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log("[Finances] Transactions returned:", result.length);

      return result;
    }),

  getCommissionsByProgram: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Finances] getCommissionsByProgram called");
      const { id } = validateToken(input.token);

      const commissions = await dbQuery<CommissionRecord>(
        `SELECT * FROM commissions WHERE ambassador_id = '${escapeSQL(id)}';`
      );

      const programs = await dbQuery<ProgramRecord>(
        `SELECT * FROM programs;`
      );

      const programMap = new Map<string, ProgramRecord>();
      for (const p of programs) {
        const pid = p.id.includes(":") ? p.id.split(":")[1] : p.id;
        programMap.set(pid, p);
      }

      const groupedMap = new Map<string, { studentIds: Set<string>; earnedUSD: number; pendingUSD: number }>();

      for (const c of commissions) {
        const key = c.program;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, { studentIds: new Set(), earnedUSD: 0, pendingUSD: 0 });
        }
        const group = groupedMap.get(key)!;
        group.studentIds.add(c.student_id);
        if (c.status === "completed" || c.status === "paid") {
          group.earnedUSD += c.amount_usd;
        } else if (c.status === "pending") {
          group.pendingUSD += c.amount_usd;
        }
      }

      const result: {
        programId: string;
        programName: string;
        studentCount: number;
        earnedUSD: number;
        pendingUSD: number;
      }[] = [];

      for (const [programId, group] of groupedMap.entries()) {
        const prog = programMap.get(programId);
        result.push({
          programId,
          programName: prog?.name || programId,
          studentCount: group.studentIds.size,
          earnedUSD: group.earnedUSD,
          pendingUSD: group.pendingUSD,
        });
      }

      result.sort((a, b) => b.earnedUSD - a.earnedUSD);

      console.log("[Finances] Program breakdown:", result.length, "programs");

      return result;
    }),
});
