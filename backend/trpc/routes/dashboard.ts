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

export const dashboardRouter = createTRPCRouter({
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
});
