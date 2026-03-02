import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery, dbQueryMultiple, generateId, nowISO } from "@/lib/db";

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

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  stage: string;
  country: string | null;
  ambassador_id: string;
  invitation_status: string | null;
  invitation_token: string | null;
  invited_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ProgramRecord {
  id: string;
  name: string;
  name_en: string;
  description: string;
  default_commission_usd: number;
  points: number;
  icon: string;
  countries: string;
  duration: string;
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
  ambassador_id: string;
  amount_usd: number;
  status: string;
}

interface AmbassadorRecord {
  id: string;
  compass_points: number;
  network_commission_rate: number;
}

interface BankAccountRecord {
  id: string;
  ambassador_id: string;
  iban: string;
  bank_name: string;
  is_default: boolean;
  status: string;
}

export const financesRouter = createTRPCRouter({
  getStats: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Dashboard] getStats called");
      const { id } = validateToken(input.token);

      const studentsResult = await dbQuery<{ count: number }>(
        `SELECT count() FROM students WHERE ambassador_id = '${escapeSQL(id)}' GROUP ALL;`
      );
      const studentsReferred = studentsResult[0]?.count ?? 0;

      const subAmbassadorsResult = await dbQuery<{ count: number }>(
        `SELECT count() FROM ambassadors WHERE parent_id = '${escapeSQL(id)}' GROUP ALL;`
      );
      const subAmbassadorsCount = subAmbassadorsResult[0]?.count ?? 0;

      const ambassadorResult = await dbQuery<AmbassadorRecord>(
        `SELECT compass_points, network_commission_rate FROM ambassadors WHERE id = '${escapeSQL(id)}' LIMIT 1;`
      );
      const compassPoints = ambassadorResult[0]?.compass_points ?? 0;

      console.log("[Dashboard] Stats:", { studentsReferred, subAmbassadorsCount, compassPoints });

      return { studentsReferred, subAmbassadorsCount, compassPoints };
    }),

  getEarnings: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Dashboard] getEarnings called");
      const { id } = validateToken(input.token);

      const commissions = await dbQuery<CommissionRecord>(
        `SELECT * FROM commissions WHERE ambassador_id = '${escapeSQL(id)}';`
      );

      let totalEarnedUSD = 0;
      let totalPendingUSD = 0;

      for (const c of commissions) {
        if (c.status === "completed" || c.status === "paid") {
          totalEarnedUSD += c.amount_usd;
        } else if (c.status === "pending") {
          totalPendingUSD += c.amount_usd;
        }
      }

      const withdrawals = await dbQuery<WithdrawalRecord>(
        `SELECT * FROM withdrawal_requests WHERE ambassador_id = '${escapeSQL(id)}' AND status = 'completed';`
      );

      let totalWithdrawn = 0;
      for (const w of withdrawals) {
        totalWithdrawn += w.amount_usd;
      }

      const availableUSD = totalEarnedUSD - totalWithdrawn;

      const ambassadorResult = await dbQuery<AmbassadorRecord>(
        `SELECT network_commission_rate FROM ambassadors WHERE id = '${escapeSQL(id)}' LIMIT 1;`
      );
      const networkRate = ambassadorResult[0]?.network_commission_rate ?? 10;

      const subAmbassadors = await dbQuery<{ id: string }>(
        `SELECT id FROM ambassadors WHERE parent_id = '${escapeSQL(id)}';`
      );

      let networkEarningsUSD = 0;
      for (const sub of subAmbassadors) {
        const subCommissions = await dbQuery<CommissionRecord>(
          `SELECT * FROM commissions WHERE ambassador_id = '${escapeSQL(sub.id)}' AND (status = 'completed' OR status = 'paid');`
        );
        for (const sc of subCommissions) {
          networkEarningsUSD += sc.amount_usd * (networkRate / 100);
        }
      }

      console.log("[Dashboard] Earnings:", { totalEarnedUSD, totalPendingUSD, availableUSD, networkEarningsUSD });

      return {
        totalEarnedUSD,
        totalPendingUSD,
        availableUSD: Math.max(0, availableUSD),
        networkEarningsUSD,
      };
    }),

  getRecentStudents: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Dashboard] getRecentStudents called");
      const { id } = validateToken(input.token);

      const students = await dbQuery<StudentRecord>(
        `SELECT * FROM students WHERE ambassador_id = '${escapeSQL(id)}' ORDER BY created_at DESC LIMIT 5;`
      );

      const programs = await dbQuery<ProgramRecord>(
        `SELECT * FROM programs;`
      );

      const programMap = new Map<string, ProgramRecord>();
      for (const p of programs) {
        const programId = p.id.includes(":") ? p.id.split(":")[1] : p.id;
        programMap.set(programId, p);
      }

      const result = students.map((s) => {
        const prog = programMap.get(s.program);
        return {
          id: s.id,
          name: s.name,
          program: s.program,
          programName: prog?.name || s.program,
          stage: s.stage,
          country: s.country,
        };
      });

      console.log("[Dashboard] Recent students:", result.length);
      return result;
    }),

  createWithdrawal: publicProcedure
    .input(z.object({
      token: z.string(),
      bankAccountId: z.string().optional(),
      iban: z.string().optional(),
      bankName: z.string().optional(),
      amountUSD: z.number().positive("Tutar sıfırdan büyük olmalı"),
      amountTRY: z.number().positive("Tutar sıfırdan büyük olmalı"),
      exchangeRate: z.number().positive(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Withdrawal] create called, amount:", input.amountUSD);
      const { id: ambassadorId } = validateToken(input.token);

      if (input.bankAccountId) {
        const bankAccounts = await dbQuery<BankAccountRecord>(
          `SELECT * FROM bank_accounts WHERE id = '${escapeSQL(input.bankAccountId)}' AND ambassador_id = '${escapeSQL(ambassadorId)}' AND status = 'approved' LIMIT 1;`
        );

        if (bankAccounts.length === 0) {
          throw new Error("Onaylı banka hesabı bulunamadı");
        }
      }

      const commissions = await dbQuery<CommissionRecord>(
        `SELECT amount_usd, status FROM commissions WHERE ambassador_id = '${escapeSQL(ambassadorId)}' AND (status = 'completed' OR status = 'paid');`
      );

      let totalEarned = 0;
      for (const c of commissions) {
        totalEarned += c.amount_usd;
      }

      const withdrawals = await dbQuery<WithdrawalRecord>(
        `SELECT amount_usd, status FROM withdrawal_requests WHERE ambassador_id = '${escapeSQL(ambassadorId)}' AND (status = 'completed' OR status = 'pending' OR status = 'approved');`
      );

      let totalWithdrawnOrPending = 0;
      for (const w of withdrawals) {
        totalWithdrawnOrPending += w.amount_usd;
      }

      const available = totalEarned - totalWithdrawnOrPending;

      if (input.amountUSD > available) {
        throw new Error(`Yetersiz bakiye. Çekilebilir tutar: $${available.toFixed(2)}`);
      }

      const now = nowISO();
      const withdrawalId = generateId();
      const transactionId = generateId();

      const bankAccountIdVal = input.bankAccountId ? `'${escapeSQL(input.bankAccountId)}'` : "'manual'";

      const sql = `
CREATE withdrawal_requests:${withdrawalId} SET
  ambassador_id = '${escapeSQL(ambassadorId)}',
  bank_account_id = ${bankAccountIdVal},
  amount_usd = ${input.amountUSD},
  amount_try = ${input.amountTRY},
  exchange_rate = ${input.exchangeRate},
  status = 'pending',
  created_at = '${now}',
  processed_at = NONE;

CREATE transactions:${transactionId} SET
  ambassador_id = '${escapeSQL(ambassadorId)}',
  type = 'payment_withdrawal',
  amount_usd = ${input.amountUSD},
  amount_try = ${input.amountTRY},
  description = 'Ödeme çekim talebi',
  student_id = NONE,
  student_name = NONE,
  status = 'pending',
  created_at = '${now}';
`;

      await dbQueryMultiple(sql);

      console.log("[Withdrawal] Created withdrawal request:", withdrawalId);

      return {
        success: true,
        message: "Çekim talebiniz alındı. İncelendikten sonra bilgilendirileceksiniz.",
      };
    }),

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

      const programs = await dbQuery<{ id: string; name: string; name_en: string }>(
        `SELECT * FROM programs;`
      );

      const programMap = new Map<string, { id: string; name: string; name_en: string }>();
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

      const programResult: {
        programId: string;
        programName: string;
        studentCount: number;
        earnedUSD: number;
        pendingUSD: number;
      }[] = [];

      for (const [programId, group] of groupedMap.entries()) {
        const prog = programMap.get(programId);
        programResult.push({
          programId,
          programName: prog?.name || programId,
          studentCount: group.studentIds.size,
          earnedUSD: group.earnedUSD,
          pendingUSD: group.pendingUSD,
        });
      }

      programResult.sort((a, b) => b.earnedUSD - a.earnedUSD);

      console.log("[Finances] Program breakdown:", programResult.length, "programs");

      return programResult;
    }),
});
