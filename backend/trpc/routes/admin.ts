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

function verifyAdmin(token: string): { id: string; email: string; role: string } {
  const decoded = decodeToken(token);
  if (!decoded) {
    throw new Error("Geçersiz oturum bilgisi");
  }
  if (decoded.exp < Date.now()) {
    throw new Error("Oturum süresi dolmuş");
  }
  if (decoded.role !== "admin") {
    throw new Error("Bu işlem için admin yetkisi gereklidir");
  }
  return { id: decoded.id, email: decoded.email, role: decoded.role };
}

interface AmbassadorRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  type: string;
  referral_code: string;
  account_status: string;
  role: string;
  parent_id: string | null;
  created_at: string;
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

interface NameChangeRecord {
  id: string;
  ambassador_id: string;
  current_first_name: string;
  current_last_name: string;
  requested_first_name: string;
  requested_last_name: string;
  status: string;
  created_at: string;
}

interface WithdrawalRecord {
  id: string;
  ambassador_id: string;
  bank_account_id: string;
  amount_usd: number;
  amount_try: number;
  exchange_rate: number;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export const adminRouter = createTRPCRouter({
  getDashboardStats: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting dashboard stats");
      verifyAdmin(input.token);

      const activeAmbassadors = await dbQuery<{ count: number }>(
        `SELECT count() FROM ambassadors WHERE account_status = 'active' GROUP ALL;`
      );

      const totalStudents = await dbQuery<{ count: number }>(
        `SELECT count() FROM students GROUP ALL;`
      );

      const pendingApprovals = await dbQuery<{ count: number }>(
        `SELECT count() FROM ambassadors WHERE account_status = 'pending_approval' GROUP ALL;`
      );

      const pendingWithdrawals = await dbQuery<{ count: number }>(
        `SELECT count() FROM withdrawal_requests WHERE status = 'pending' GROUP ALL;`
      );

      const pendingBanks = await dbQuery<{ count: number }>(
        `SELECT count() FROM bank_accounts WHERE status = 'pending' GROUP ALL;`
      );

      const pendingNameChanges = await dbQuery<{ count: number }>(
        `SELECT count() FROM name_change_requests WHERE status = 'pending' GROUP ALL;`
      );

      return {
        totalAmbassadors: activeAmbassadors[0]?.count ?? 0,
        totalStudents: totalStudents[0]?.count ?? 0,
        pendingApprovals: pendingApprovals[0]?.count ?? 0,
        pendingWithdrawals: pendingWithdrawals[0]?.count ?? 0,
        pendingBankAccounts: pendingBanks[0]?.count ?? 0,
        pendingNameChanges: pendingNameChanges[0]?.count ?? 0,
      };
    }),

  getPendingAmbassadors: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting pending ambassadors");
      verifyAdmin(input.token);

      const pending = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE account_status = 'pending_approval' ORDER BY created_at DESC;`
      );

      const result = [];
      for (const amb of pending) {
        let referredBy: string | undefined;
        if (amb.parent_id) {
          const parentId = typeof amb.parent_id === 'string' && amb.parent_id.includes(':')
            ? amb.parent_id.split(':')[1] : amb.parent_id;
          const parent = await dbQuery<AmbassadorRecord>(
            `SELECT referral_code FROM ambassadors WHERE id = '${escapeSQL(parentId)}' LIMIT 1;`
          );
          referredBy = parent[0]?.referral_code;
        }

        result.push({
          id: typeof amb.id === 'string' && amb.id.includes(':') ? amb.id.split(':')[1] : amb.id,
          name: `${amb.first_name} ${amb.last_name}`,
          email: amb.email,
          phone: amb.phone,
          registrationDate: amb.created_at,
          status: 'pending' as const,
          referredBy,
        });
      }

      return result;
    }),

  approveAmbassador: publicProcedure
    .input(z.object({ token: z.string(), ambassadorId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Approving ambassador:", input.ambassadorId);
      verifyAdmin(input.token);
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE ambassadors:${escapeSQL(input.ambassadorId)} SET account_status = 'active', updated_at = '${now}';`
      );

      const notifId = generateId();
      await dbQueryMultiple(`CREATE notifications:${notifId} SET
        ambassador_id = 'ambassadors:${escapeSQL(input.ambassadorId)}',
        type = 'announcement',
        title = 'Hesabınız Onaylandı!',
        message = 'Hesabınız onaylandı! Artık Compass Abroad Elçisi olarak çalışmaya başlayabilirsiniz.',
        read = false,
        created_at = '${now}';`);

      return { success: true };
    }),

  rejectAmbassador: publicProcedure
    .input(z.object({ token: z.string(), ambassadorId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Rejecting ambassador:", input.ambassadorId);
      verifyAdmin(input.token);
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE ambassadors:${escapeSQL(input.ambassadorId)} SET account_status = 'rejected', updated_at = '${now}';`
      );

      return { success: true };
    }),

  getPendingBankAccounts: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting pending bank accounts");
      verifyAdmin(input.token);

      const pendingBanks = await dbQuery<BankAccountRecord>(
        `SELECT * FROM bank_accounts WHERE status = 'pending' ORDER BY submitted_at DESC;`
      );

      const result = [];
      for (const bank of pendingBanks) {
        const ambId = typeof bank.ambassador_id === 'string' && bank.ambassador_id.includes(':')
          ? bank.ambassador_id.split(':')[1] : bank.ambassador_id;
        const ambassador = await dbQuery<AmbassadorRecord>(
          `SELECT first_name, last_name, email FROM ambassadors WHERE id = '${escapeSQL(ambId)}' LIMIT 1;`
        );
        const amb = ambassador[0];

        result.push({
          id: typeof bank.id === 'string' && bank.id.includes(':') ? bank.id.split(':')[1] : bank.id,
          ambassadorId: ambId,
          ambassadorName: amb ? `${amb.first_name} ${amb.last_name}` : 'Bilinmeyen',
          ambassadorEmail: amb?.email ?? '',
          iban: bank.iban,
          bankName: bank.bank_name,
          submittedAt: bank.submitted_at,
        });
      }

      return result;
    }),

  approveBankAccount: publicProcedure
    .input(z.object({ token: z.string(), bankAccountId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Approving bank account:", input.bankAccountId);
      verifyAdmin(input.token);
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE bank_accounts:${escapeSQL(input.bankAccountId)} SET status = 'approved', approved_at = '${now}';`
      );

      return { success: true };
    }),

  rejectBankAccount: publicProcedure
    .input(z.object({ token: z.string(), bankAccountId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Rejecting bank account:", input.bankAccountId);
      verifyAdmin(input.token);

      await dbQueryMultiple(
        `UPDATE bank_accounts:${escapeSQL(input.bankAccountId)} SET status = 'rejected';`
      );

      return { success: true };
    }),

  getNameChangeRequests: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting name change requests");
      verifyAdmin(input.token);

      const requests = await dbQuery<NameChangeRecord>(
        `SELECT * FROM name_change_requests WHERE status = 'pending' ORDER BY created_at DESC;`
      );

      const result = [];
      for (const req of requests) {
        const ambId = typeof req.ambassador_id === 'string' && req.ambassador_id.includes(':')
          ? req.ambassador_id.split(':')[1] : req.ambassador_id;
        const ambassador = await dbQuery<AmbassadorRecord>(
          `SELECT first_name, last_name FROM ambassadors WHERE id = '${escapeSQL(ambId)}' LIMIT 1;`
        );
        const amb = ambassador[0];

        result.push({
          id: typeof req.id === 'string' && req.id.includes(':') ? req.id.split(':')[1] : req.id,
          ambassadorId: ambId,
          ambassadorName: amb ? `${amb.first_name} ${amb.last_name}` : 'Bilinmeyen',
          currentFirstName: req.current_first_name,
          currentLastName: req.current_last_name,
          requestedFirstName: req.requested_first_name,
          requestedLastName: req.requested_last_name,
          requestDate: req.created_at,
          status: req.status,
        });
      }

      return result;
    }),

  approveNameChange: publicProcedure
    .input(z.object({ token: z.string(), requestId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Approving name change:", input.requestId);
      verifyAdmin(input.token);
      const now = nowISO();

      const requests = await dbQuery<NameChangeRecord>(
        `SELECT * FROM name_change_requests:${escapeSQL(input.requestId)};`
      );

      if (requests.length === 0) {
        throw new Error("İsim değişikliği talebi bulunamadı");
      }

      const req = requests[0];
      const ambId = typeof req.ambassador_id === 'string' && req.ambassador_id.includes(':')
        ? req.ambassador_id.split(':')[1] : req.ambassador_id;

      await dbQueryMultiple(
        `UPDATE ambassadors:${escapeSQL(ambId)} SET first_name = '${escapeSQL(req.requested_first_name)}', last_name = '${escapeSQL(req.requested_last_name)}', pending_first_name = NONE, pending_last_name = NONE, name_change_request_date = NONE, updated_at = '${now}';`
      );

      await dbQueryMultiple(
        `UPDATE name_change_requests:${escapeSQL(input.requestId)} SET status = 'approved';`
      );

      return { success: true };
    }),

  rejectNameChange: publicProcedure
    .input(z.object({ token: z.string(), requestId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Rejecting name change:", input.requestId);
      verifyAdmin(input.token);
      const now = nowISO();

      const requests = await dbQuery<NameChangeRecord>(
        `SELECT * FROM name_change_requests:${escapeSQL(input.requestId)};`
      );

      if (requests.length === 0) {
        throw new Error("İsim değişikliği talebi bulunamadı");
      }

      const req = requests[0];
      const ambId = typeof req.ambassador_id === 'string' && req.ambassador_id.includes(':')
        ? req.ambassador_id.split(':')[1] : req.ambassador_id;

      await dbQueryMultiple(
        `UPDATE ambassadors:${escapeSQL(ambId)} SET pending_first_name = NONE, pending_last_name = NONE, name_change_request_date = NONE, updated_at = '${now}';`
      );

      await dbQueryMultiple(
        `UPDATE name_change_requests:${escapeSQL(input.requestId)} SET status = 'rejected';`
      );

      return { success: true };
    }),

  getPendingWithdrawals: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting pending withdrawals");
      verifyAdmin(input.token);

      const withdrawals = await dbQuery<WithdrawalRecord>(
        `SELECT * FROM withdrawal_requests WHERE status = 'pending' ORDER BY created_at DESC;`
      );

      const result = [];
      for (const w of withdrawals) {
        const ambId = typeof w.ambassador_id === 'string' && w.ambassador_id.includes(':')
          ? w.ambassador_id.split(':')[1] : w.ambassador_id;
        const ambassador = await dbQuery<AmbassadorRecord>(
          `SELECT first_name, last_name, email FROM ambassadors WHERE id = '${escapeSQL(ambId)}' LIMIT 1;`
        );
        const amb = ambassador[0];

        let bankInfo = { iban: '', bankName: '' };
        if (w.bank_account_id) {
          const bankId = typeof w.bank_account_id === 'string' && w.bank_account_id.includes(':')
            ? w.bank_account_id.split(':')[1] : w.bank_account_id;
          const banks = await dbQuery<BankAccountRecord>(
            `SELECT iban, bank_name FROM bank_accounts WHERE id = '${escapeSQL(bankId)}' LIMIT 1;`
          );
          if (banks[0]) {
            bankInfo = { iban: banks[0].iban, bankName: banks[0].bank_name };
          }
        }

        result.push({
          id: typeof w.id === 'string' && w.id.includes(':') ? w.id.split(':')[1] : w.id,
          ambassadorId: ambId,
          ambassadorName: amb ? `${amb.first_name} ${amb.last_name}` : 'Bilinmeyen',
          ambassadorEmail: amb?.email ?? '',
          amountUSD: w.amount_usd,
          amountTRY: w.amount_try,
          exchangeRate: w.exchange_rate,
          iban: bankInfo.iban,
          bankName: bankInfo.bankName,
          createdAt: w.created_at,
        });
      }

      return result;
    }),

  approveWithdrawal: publicProcedure
    .input(z.object({ token: z.string(), withdrawalId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Approving withdrawal:", input.withdrawalId);
      verifyAdmin(input.token);
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE withdrawal_requests:${escapeSQL(input.withdrawalId)} SET status = 'completed', processed_at = '${now}';`
      );

      const transactions = await dbQuery<{ id: string }>(
        `SELECT * FROM transactions WHERE type = 'payment_withdrawal' AND status = 'pending' LIMIT 5;`
      );

      for (const t of transactions) {
        const tId = typeof t.id === 'string' && t.id.includes(':') ? t.id.split(':')[1] : t.id;
        await dbQueryMultiple(
          `UPDATE transactions:${escapeSQL(tId)} SET status = 'completed';`
        );
      }

      return { success: true };
    }),

  rejectWithdrawal: publicProcedure
    .input(z.object({ token: z.string(), withdrawalId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Rejecting withdrawal:", input.withdrawalId);
      verifyAdmin(input.token);
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE withdrawal_requests:${escapeSQL(input.withdrawalId)} SET status = 'rejected', processed_at = '${now}';`
      );

      return { success: true };
    }),

  getProgramCommissions: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting program commissions");
      verifyAdmin(input.token);

      const programs = await dbQuery<{ id: string; name: string; name_en: string; default_commission_usd: number; points: number }>(
        `SELECT * FROM programs ORDER BY name ASC;`
      );

      return programs.map(p => ({
        programId: typeof p.id === 'string' && p.id.includes(':') ? p.id.split(':')[1] : p.id,
        programName: p.name,
        programNameEn: p.name_en,
        defaultCommissionUSD: p.default_commission_usd,
        points: p.points,
      }));
    }),

  updateProgramCommission: publicProcedure
    .input(z.object({ token: z.string(), programId: z.string(), commissionUSD: z.number() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Updating program commission:", input.programId, "to $" + input.commissionUSD);
      verifyAdmin(input.token);

      await dbQueryMultiple(
        `UPDATE programs:${escapeSQL(input.programId)} SET default_commission_usd = ${input.commissionUSD};`
      );

      return { success: true };
    }),

  getAmbassadorCommissions: publicProcedure
    .input(z.object({ token: z.string(), ambassadorId: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting ambassador commissions for:", input.ambassadorId);
      verifyAdmin(input.token);

      const ambassador = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(input.ambassadorId)}' OR id = 'ambassadors:${escapeSQL(input.ambassadorId)}' LIMIT 1;`
      );

      if (ambassador.length === 0) {
        throw new Error("Elçi bulunamadı");
      }

      const amb = ambassador[0];
      const ambId = typeof amb.id === 'string' && amb.id.includes(':') ? amb.id.split(':')[1] : amb.id;

      const customCommissions = await dbQuery<{ id: string; ambassador_id: string; program_id: string; custom_commission_usd: number | null; use_custom: boolean }>(
        `SELECT * FROM ambassador_commissions WHERE ambassador_id = '${escapeSQL(ambId)}' OR ambassador_id = 'ambassadors:${escapeSQL(ambId)}';`
      );

      const programs = await dbQuery<{ id: string; name: string; name_en: string; default_commission_usd: number }>(
        `SELECT * FROM programs ORDER BY name ASC;`
      );

      return {
        ambassador: {
          id: ambId,
          name: `${amb.first_name} ${amb.last_name}`,
          email: amb.email,
          type: amb.type,
          referralCode: amb.referral_code,
        },
        commissions: programs.map(p => {
          const pid = typeof p.id === 'string' && p.id.includes(':') ? p.id.split(':')[1] : p.id;
          const custom = customCommissions.find(c => {
            const cpid = typeof c.program_id === 'string' && c.program_id.includes(':') ? c.program_id.split(':')[1] : c.program_id;
            return cpid === pid;
          });
          return {
            programId: pid,
            programName: p.name,
            programNameEn: p.name_en,
            defaultCommissionUSD: p.default_commission_usd,
            customCommissionUSD: custom?.custom_commission_usd ?? null,
            useCustom: custom?.use_custom ?? false,
          };
        }),
      };
    }),

  updateAmbassadorCommission: publicProcedure
    .input(z.object({
      token: z.string(),
      ambassadorId: z.string(),
      programId: z.string(),
      customCommissionUSD: z.number().nullable(),
      useCustom: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Updating ambassador commission:", input.ambassadorId, input.programId);
      verifyAdmin(input.token);

      const existing = await dbQuery<{ id: string }>(
        `SELECT * FROM ambassador_commissions WHERE (ambassador_id = '${escapeSQL(input.ambassadorId)}' OR ambassador_id = 'ambassadors:${escapeSQL(input.ambassadorId)}') AND (program_id = '${escapeSQL(input.programId)}' OR program_id = 'programs:${escapeSQL(input.programId)}') LIMIT 1;`
      );

      if (existing.length > 0) {
        const existId = typeof existing[0].id === 'string' && existing[0].id.includes(':') ? existing[0].id.split(':')[1] : existing[0].id;
        const customVal = input.customCommissionUSD !== null ? input.customCommissionUSD.toString() : 'NONE';
        await dbQueryMultiple(
          `UPDATE ambassador_commissions:${escapeSQL(existId)} SET custom_commission_usd = ${customVal}, use_custom = ${input.useCustom};`
        );
      } else {
        const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const customVal = input.customCommissionUSD !== null ? input.customCommissionUSD.toString() : 'NONE';
        await dbQueryMultiple(`
CREATE ambassador_commissions:${newId} SET
  ambassador_id = '${escapeSQL(input.ambassadorId)}',
  program_id = 'programs:${escapeSQL(input.programId)}',
  custom_commission_usd = ${customVal},
  use_custom = ${input.useCustom};
`);
      }

      return { success: true };
    }),

  updateNetworkCommissionRate: publicProcedure
    .input(z.object({ token: z.string(), ambassadorId: z.string(), rate: z.number().min(0).max(100) }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Updating network commission rate:", input.ambassadorId, input.rate);
      verifyAdmin(input.token);

      await dbQueryMultiple(
        `UPDATE ambassadors:${escapeSQL(input.ambassadorId)} SET network_commission_rate = ${input.rate};`
      );

      return { success: true };
    }),

  getAmbassadorDetail: publicProcedure
    .input(z.object({ token: z.string(), ambassadorId: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting ambassador detail:", input.ambassadorId);
      verifyAdmin(input.token);

      const results = await dbQuery<AmbassadorRecord & { compass_points: number; network_commission_rate: number; type: string; category: string; sub_type: string; company_name: string | null }>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(input.ambassadorId)}' OR id = 'ambassadors:${escapeSQL(input.ambassadorId)}' LIMIT 1;`
      );

      if (results.length === 0) throw new Error("Elçi bulunamadı");

      const amb = results[0];
      const ambId = typeof amb.id === 'string' && amb.id.includes(':') ? amb.id.split(':')[1] : amb.id;

      const studentCount = await dbQuery<{ count: number }>(
        `SELECT count() FROM students WHERE ambassador_id = '${escapeSQL(ambId)}' GROUP ALL;`
      );

      const earningsResult = await dbQuery<{ total: number }>(
        `SELECT math::sum(amount_usd) as total FROM commissions WHERE ambassador_id = '${escapeSQL(ambId)}' AND status = 'completed' GROUP ALL;`
      );

      const subAmbassadors = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE parent_id = '${escapeSQL(ambId)}' OR parent_id = 'ambassadors:${escapeSQL(ambId)}';`
      );

      return {
        id: ambId,
        name: `${amb.first_name} ${amb.last_name}`,
        firstName: amb.first_name,
        lastName: amb.last_name,
        email: amb.email,
        phone: amb.phone,
        city: amb.city,
        type: amb.type,
        referralCode: amb.referral_code,
        accountStatus: amb.account_status,
        compassPoints: (amb as any).compass_points ?? 0,
        networkCommissionRate: (amb as any).network_commission_rate ?? 10,
        studentsReferred: studentCount[0]?.count ?? 0,
        totalEarningsUSD: earningsResult[0]?.total ?? 0,
        joinedAt: amb.created_at,
        subAmbassadors: subAmbassadors.map(s => ({
          id: typeof s.id === 'string' && s.id.includes(':') ? s.id.split(':')[1] : s.id,
          name: `${s.first_name} ${s.last_name}`,
          type: s.type,
          referralCode: s.referral_code,
        })),
      };
    }),

  getAllAmbassadors: publicProcedure
    .input(z.object({ token: z.string(), search: z.string().optional() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting all ambassadors");
      verifyAdmin(input.token);

      let sql = `SELECT * FROM ambassadors WHERE account_status = 'active' ORDER BY created_at DESC;`;
      if (input.search && input.search.trim()) {
        const s = escapeSQL(input.search.trim().toLowerCase());
        sql = `SELECT * FROM ambassadors WHERE account_status = 'active' AND (string::lowercase(first_name) CONTAINS '${s}' OR string::lowercase(last_name) CONTAINS '${s}' OR string::lowercase(email) CONTAINS '${s}' OR string::lowercase(referral_code) CONTAINS '${s}') ORDER BY created_at DESC;`;
      }

      const ambassadors = await dbQuery<AmbassadorRecord>(sql);

      return ambassadors.map(a => ({
        id: typeof a.id === 'string' && a.id.includes(':') ? a.id.split(':')[1] : a.id,
        name: `${a.first_name} ${a.last_name}`,
        email: a.email,
        type: a.type,
        referralCode: a.referral_code,
        city: a.city,
        createdAt: a.created_at,
      }));
    }),
});
