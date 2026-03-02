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
  submitted_at: string;
  approved_at: string | null;
}

export const bankAccountsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[BankAccounts] list called");
      const { id } = validateToken(input.token);

      const accounts = await dbQuery<BankAccountRecord>(
        `SELECT * FROM bank_accounts WHERE ambassador_id = '${escapeSQL(id)}' ORDER BY is_default DESC, submitted_at DESC;`
      );

      console.log("[BankAccounts] Found", accounts.length, "accounts");

      return accounts.map((a) => ({
        id: a.id,
        iban: a.iban,
        bankName: a.bank_name,
        isDefault: a.is_default,
        status: a.status,
        submittedAt: a.submitted_at,
        approvedAt: a.approved_at,
      }));
    }),

  add: publicProcedure
    .input(z.object({
      token: z.string(),
      iban: z.string(),
      bankName: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log("[BankAccounts] add called, bank:", input.bankName);
      const { id } = validateToken(input.token);

      const cleaned = input.iban.replace(/\s/g, "").toUpperCase();

      if (!cleaned.startsWith("TR")) {
        throw new Error("IBAN 'TR' ile başlamalıdır");
      }
      if (cleaned.length !== 26) {
        throw new Error("IBAN 26 karakter olmalıdır");
      }
      const afterTR = cleaned.slice(2);
      if (!/^\d+$/.test(afterTR)) {
        throw new Error("TR sonrası sadece rakam olmalıdır");
      }

      const existing = await dbQuery<BankAccountRecord>(
        `SELECT * FROM bank_accounts WHERE ambassador_id = '${escapeSQL(id)}' AND iban = '${escapeSQL(cleaned)}' LIMIT 1;`
      );

      if (existing.length > 0) {
        throw new Error("Bu IBAN zaten kayıtlı");
      }

      const allAccounts = await dbQuery<BankAccountRecord>(
        `SELECT * FROM bank_accounts WHERE ambassador_id = '${escapeSQL(id)}' AND status = 'approved';`
      );

      const isFirst = allAccounts.length === 0;
      const now = nowISO();
      const accountId = generateId();

      const sql = `CREATE bank_accounts:${accountId} SET
  ambassador_id = '${escapeSQL(id)}',
  iban = '${escapeSQL(cleaned)}',
  bank_name = '${escapeSQL(input.bankName)}',
  is_default = ${isFirst},
  status = 'pending',
  submitted_at = '${now}',
  approved_at = NONE;`;

      await dbQueryMultiple(sql);

      console.log("[BankAccounts] Account added:", accountId, "isDefault:", isFirst);

      return {
        success: true,
        message: "Banka hesabı eklendi. Admin onayı bekleniyor.",
      };
    }),

  setDefault: publicProcedure
    .input(z.object({
      token: z.string(),
      bankAccountId: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log("[BankAccounts] setDefault called for:", input.bankAccountId);
      const { id } = validateToken(input.token);

      const accounts = await dbQuery<BankAccountRecord>(
        `SELECT * FROM bank_accounts WHERE id = '${escapeSQL(input.bankAccountId)}' AND ambassador_id = '${escapeSQL(id)}' LIMIT 1;`
      );

      if (accounts.length === 0) {
        throw new Error("Banka hesabı bulunamadı");
      }

      if (accounts[0].status !== "approved") {
        throw new Error("Sadece onaylanmış hesaplar varsayılan olarak ayarlanabilir");
      }

      await dbQueryMultiple(
        `UPDATE bank_accounts SET is_default = false WHERE ambassador_id = '${escapeSQL(id)}';`
      );

      await dbQueryMultiple(
        `UPDATE bank_accounts SET is_default = true WHERE id = '${escapeSQL(input.bankAccountId)}';`
      );

      console.log("[BankAccounts] Default set to:", input.bankAccountId);

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({
      token: z.string(),
      bankAccountId: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log("[BankAccounts] delete called for:", input.bankAccountId);
      const { id } = validateToken(input.token);

      const accounts = await dbQuery<BankAccountRecord>(
        `SELECT * FROM bank_accounts WHERE id = '${escapeSQL(input.bankAccountId)}' AND ambassador_id = '${escapeSQL(id)}' LIMIT 1;`
      );

      if (accounts.length === 0) {
        throw new Error("Banka hesabı bulunamadı");
      }

      if (accounts[0].is_default) {
        throw new Error("Varsayılan hesap silinemez. Önce başka bir hesabı varsayılan yapın.");
      }

      await dbQueryMultiple(
        `DELETE FROM bank_accounts WHERE id = '${escapeSQL(input.bankAccountId)}';`
      );

      console.log("[BankAccounts] Account deleted:", input.bankAccountId);

      return { success: true };
    }),
});
