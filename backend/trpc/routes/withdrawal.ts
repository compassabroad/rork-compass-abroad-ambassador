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

interface BankAccountRecord {
  id: string;
  ambassador_id: string;
  iban: string;
  bank_name: string;
  is_default: boolean;
  status: string;
}

interface CommissionRecord {
  amount_usd: number;
  status: string;
}

interface WithdrawalRecord {
  amount_usd: number;
  status: string;
}

export const withdrawalRouter = createTRPCRouter({
  create: publicProcedure
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
});
