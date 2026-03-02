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

function cleanId(id: string): string {
  return typeof id === 'string' && id.includes(':') ? id.split(':')[1] : id;
}

const STAGE_LABELS_TR: Record<string, string> = {
  pre_payment: 'Ön Ödeme',
  registered: 'Kayıt',
  documents_completed: 'Belgeler Tamam',
  visa_applied: 'Vize Başvurusu',
  visa_approved: 'Vize Onaylandı',
  visa_rejected: 'Vize Red',
  orientation: 'Oryantasyon',
  departed: 'Uçtu',
};

const AMBASSADOR_TYPE_LABELS_TR: Record<string, string> = {
  bronze: 'Bronz',
  silver: 'Gümüş',
  gold: 'Altın',
  platinum: 'Platin',
  diamond: 'Elmas',
};

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
  compass_points?: number;
  network_commission_rate?: number;
  category?: string;
  sub_type?: string;
  company_name?: string | null;
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

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  stage: string;
  ambassador_id: string;
  country: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  invitation_status: string | null;
  invitation_token: string | null;
}

interface ProgramRecord {
  id: string;
  name: string;
  name_en: string;
  default_commission_usd: number;
  points: number;
  description: string;
  duration: string;
  countries: string[];
}

interface CommissionRecord {
  id: string;
  ambassador_id: string;
  student_id: string;
  program_id: string;
  amount_usd: number;
  status: string;
  stage: string;
  created_at: string;
}

interface AnnouncementRecord {
  id: string;
  title: string;
  preview: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

async function getCommissionAmountForAmbassador(ambassadorId: string, programId: string): Promise<number> {
  console.log("[Admin] Getting commission amount for ambassador:", ambassadorId, "program:", programId);
  const customCommissions = await dbQuery<{ custom_commission_usd: number | null; use_custom: boolean }>(
    `SELECT custom_commission_usd, use_custom FROM ambassador_commissions WHERE (ambassador_id = '${escapeSQL(ambassadorId)}' OR ambassador_id = 'ambassadors:${escapeSQL(ambassadorId)}') AND (program_id = '${escapeSQL(programId)}' OR program_id = 'programs:${escapeSQL(programId)}') LIMIT 1;`
  );

  if (customCommissions.length > 0 && customCommissions[0].use_custom && customCommissions[0].custom_commission_usd !== null) {
    console.log("[Admin] Using custom commission:", customCommissions[0].custom_commission_usd);
    return customCommissions[0].custom_commission_usd;
  }

  const program = await dbQuery<ProgramRecord>(
    `SELECT default_commission_usd FROM programs WHERE id = '${escapeSQL(programId)}' OR id = 'programs:${escapeSQL(programId)}' LIMIT 1;`
  );

  const defaultAmount = program[0]?.default_commission_usd ?? 0;
  console.log("[Admin] Using default commission:", defaultAmount);
  return defaultAmount;
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

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const commissionsPaidThisMonth = await dbQuery<{ total: number }>(
        `SELECT math::sum(amount_usd) as total FROM commissions WHERE status = 'completed' AND created_at >= '${monthStart}' GROUP ALL;`
      );

      const pendingWithdrawalsAmount = await dbQuery<{ total: number }>(
        `SELECT math::sum(amount_usd) as total FROM withdrawal_requests WHERE status = 'pending' GROUP ALL;`
      );

      const studentsByStage = await dbQuery<{ stage: string; count: number }>(
        `SELECT stage, count() FROM students GROUP BY stage;`
      );

      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const newRegistrationsThisWeek = await dbQuery<{ count: number }>(
        `SELECT count() FROM ambassadors WHERE created_at >= '${weekAgo}' GROUP ALL;`
      );

      const allAmbassadors = await dbQuery<AmbassadorRecord & { compass_points: number }>(
        `SELECT * FROM ambassadors WHERE account_status = 'active' ORDER BY created_at DESC;`
      );

      const topAmbassadors = [];
      for (const amb of allAmbassadors.slice(0, 10)) {
        const ambId = cleanId(amb.id);
        const studentCount = await dbQuery<{ count: number }>(
          `SELECT count() FROM students WHERE ambassador_id = '${escapeSQL(ambId)}' GROUP ALL;`
        );
        topAmbassadors.push({
          id: ambId,
          name: `${amb.first_name} ${amb.last_name}`,
          studentsReferred: studentCount[0]?.count ?? 0,
          type: amb.type,
        });
      }

      topAmbassadors.sort((a, b) => b.studentsReferred - a.studentsReferred);

      return {
        totalAmbassadors: activeAmbassadors[0]?.count ?? 0,
        totalStudents: totalStudents[0]?.count ?? 0,
        pendingApprovals: pendingApprovals[0]?.count ?? 0,
        pendingWithdrawals: pendingWithdrawals[0]?.count ?? 0,
        pendingBankAccounts: pendingBanks[0]?.count ?? 0,
        pendingNameChanges: pendingNameChanges[0]?.count ?? 0,
        commissionsPaidThisMonth: commissionsPaidThisMonth[0]?.total ?? 0,
        pendingWithdrawalsAmount: pendingWithdrawalsAmount[0]?.total ?? 0,
        studentsByStage: studentsByStage.map(s => ({
          stage: s.stage,
          count: s.count,
        })),
        newRegistrationsThisWeek: newRegistrationsThisWeek[0]?.count ?? 0,
        topAmbassadors: topAmbassadors.slice(0, 5),
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
          const parentId = cleanId(amb.parent_id);
          const parent = await dbQuery<AmbassadorRecord>(
            `SELECT referral_code FROM ambassadors WHERE id = '${escapeSQL(parentId)}' LIMIT 1;`
          );
          referredBy = parent[0]?.referral_code;
        }

        result.push({
          id: cleanId(amb.id),
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
        const ambId = cleanId(bank.ambassador_id);
        const ambassador = await dbQuery<AmbassadorRecord>(
          `SELECT first_name, last_name, email FROM ambassadors WHERE id = '${escapeSQL(ambId)}' LIMIT 1;`
        );
        const amb = ambassador[0];

        result.push({
          id: cleanId(bank.id),
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
        const ambId = cleanId(req.ambassador_id);
        const ambassador = await dbQuery<AmbassadorRecord>(
          `SELECT first_name, last_name FROM ambassadors WHERE id = '${escapeSQL(ambId)}' LIMIT 1;`
        );
        const amb = ambassador[0];

        result.push({
          id: cleanId(req.id),
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
      const ambId = cleanId(req.ambassador_id);

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
      const ambId = cleanId(req.ambassador_id);

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
        const ambId = cleanId(w.ambassador_id);
        const ambassador = await dbQuery<AmbassadorRecord>(
          `SELECT first_name, last_name, email FROM ambassadors WHERE id = '${escapeSQL(ambId)}' LIMIT 1;`
        );
        const amb = ambassador[0];

        let bankInfo = { iban: '', bankName: '' };
        if (w.bank_account_id) {
          const bankId = cleanId(w.bank_account_id);
          const banks = await dbQuery<BankAccountRecord>(
            `SELECT iban, bank_name FROM bank_accounts WHERE id = '${escapeSQL(bankId)}' LIMIT 1;`
          );
          if (banks[0]) {
            bankInfo = { iban: banks[0].iban, bankName: banks[0].bank_name };
          }
        }

        result.push({
          id: cleanId(w.id),
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
        const tId = cleanId(t.id);
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

      const programs = await dbQuery<ProgramRecord>(
        `SELECT * FROM programs ORDER BY name ASC;`
      );

      return programs.map(p => ({
        programId: cleanId(p.id),
        programName: p.name,
        programNameEn: p.name_en,
        defaultCommissionUSD: p.default_commission_usd,
        points: p.points,
        description: p.description ?? '',
        duration: p.duration ?? '',
        countries: p.countries ?? [],
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

  updateProgram: publicProcedure
    .input(z.object({
      token: z.string(),
      programId: z.string(),
      defaultCommissionUSD: z.number().optional(),
      points: z.number().optional(),
      description: z.string().optional(),
      duration: z.string().optional(),
      countries: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Updating program:", input.programId);
      verifyAdmin(input.token);

      const updates: string[] = [];
      if (input.defaultCommissionUSD !== undefined) {
        updates.push(`default_commission_usd = ${input.defaultCommissionUSD}`);
      }
      if (input.points !== undefined) {
        updates.push(`points = ${input.points}`);
      }
      if (input.description !== undefined) {
        updates.push(`description = '${escapeSQL(input.description)}'`);
      }
      if (input.duration !== undefined) {
        updates.push(`duration = '${escapeSQL(input.duration)}'`);
      }
      if (input.countries !== undefined) {
        const countriesStr = input.countries.map(c => `'${escapeSQL(c)}'`).join(', ');
        updates.push(`countries = [${countriesStr}]`);
      }

      if (updates.length > 0) {
        await dbQueryMultiple(
          `UPDATE programs:${escapeSQL(input.programId)} SET ${updates.join(', ')};`
        );
      }

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
      const ambId = cleanId(amb.id);

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
          const pid = cleanId(p.id);
          const custom = customCommissions.find(c => {
            const cpid = cleanId(c.program_id);
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
        const existId = cleanId(existing[0].id);
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

      const results = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(input.ambassadorId)}' OR id = 'ambassadors:${escapeSQL(input.ambassadorId)}' LIMIT 1;`
      );

      if (results.length === 0) throw new Error("Elçi bulunamadı");

      const amb = results[0];
      const ambId = cleanId(amb.id);

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
        compassPoints: amb.compass_points ?? 0,
        networkCommissionRate: amb.network_commission_rate ?? 10,
        studentsReferred: studentCount[0]?.count ?? 0,
        totalEarningsUSD: earningsResult[0]?.total ?? 0,
        joinedAt: amb.created_at,
        subAmbassadors: subAmbassadors.map(s => ({
          id: cleanId(s.id),
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
        id: cleanId(a.id),
        name: `${a.first_name} ${a.last_name}`,
        email: a.email,
        type: a.type,
        referralCode: a.referral_code,
        city: a.city,
        createdAt: a.created_at,
      }));
    }),

  updateStudentStage: publicProcedure
    .input(z.object({
      token: z.string(),
      studentId: z.string(),
      newStage: z.enum(['pre_payment', 'registered', 'documents_completed', 'visa_applied', 'visa_approved', 'visa_rejected', 'orientation', 'departed']),
    }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Updating student stage:", input.studentId, "to", input.newStage);
      const admin = verifyAdmin(input.token);
      const now = nowISO();

      const students = await dbQuery<StudentRecord>(
        `SELECT * FROM students WHERE id = '${escapeSQL(input.studentId)}' OR id = 'students:${escapeSQL(input.studentId)}' LIMIT 1;`
      );

      if (students.length === 0) {
        throw new Error("Öğrenci bulunamadı");
      }

      const student = students[0];
      const studentId = cleanId(student.id);
      const ambassadorId = cleanId(student.ambassador_id);

      const ambassadors = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(ambassadorId)}' OR id = 'ambassadors:${escapeSQL(ambassadorId)}' LIMIT 1;`
      );

      if (ambassadors.length === 0) {
        throw new Error("İlgili elçi bulunamadı");
      }

      const ambassador = ambassadors[0];
      const ambId = cleanId(ambassador.id);

      await dbQueryMultiple(
        `UPDATE students:${escapeSQL(studentId)} SET stage = '${input.newStage}', updated_at = '${now}';`
      );

      const pipelineId = generateId();
      await dbQueryMultiple(`CREATE student_pipeline_history:${pipelineId} SET
        student_id = 'students:${escapeSQL(studentId)}',
        stage = '${input.newStage}',
        date = '${now}',
        changed_by = '${escapeSQL(admin.id)}',
        created_at = '${now}';`);

      const programId = cleanId(student.program);
      const commissionTotal = await getCommissionAmountForAmbassador(ambId, programId);
      let commissionAmount = 0;
      let commissionStatus = 'pending';
      let commissionMessage = '';

      if (input.newStage === 'registered') {
        commissionAmount = commissionTotal * 0.25;
        commissionStatus = 'pending';
        commissionMessage = `Komisyon: $${commissionAmount.toFixed(0)} (kayıt - %25)`;
      } else if (input.newStage === 'visa_approved') {
        commissionAmount = commissionTotal * 0.25;
        commissionStatus = 'pending';
        commissionMessage = `Komisyon: $${commissionAmount.toFixed(0)} (vize onayı - %25)`;
      } else if (input.newStage === 'departed') {
        commissionAmount = commissionTotal * 0.50;
        commissionStatus = 'completed';
        commissionMessage = `Komisyon: $${commissionAmount.toFixed(0)} (uçuş - %50)`;

        const pendingCommissions = await dbQuery<CommissionRecord>(
          `SELECT * FROM commissions WHERE student_id = '${escapeSQL(studentId)}' AND ambassador_id = '${escapeSQL(ambId)}' AND status = 'pending';`
        );
        for (const pc of pendingCommissions) {
          const pcId = cleanId(pc.id);
          await dbQueryMultiple(
            `UPDATE commissions:${escapeSQL(pcId)} SET status = 'completed';`
          );
        }
      } else if (input.newStage === 'visa_rejected') {
        const pendingCommissions = await dbQuery<CommissionRecord>(
          `SELECT * FROM commissions WHERE student_id = '${escapeSQL(studentId)}' AND ambassador_id = '${escapeSQL(ambId)}' AND status = 'pending';`
        );
        for (const pc of pendingCommissions) {
          const pcId = cleanId(pc.id);
          await dbQueryMultiple(
            `UPDATE commissions:${escapeSQL(pcId)} SET status = 'cancelled';`
          );
        }
        commissionMessage = 'Bekleyen komisyonlar iptal edildi';
      }

      if (commissionAmount > 0) {
        const commId = generateId();
        await dbQueryMultiple(`CREATE commissions:${commId} SET
          ambassador_id = '${escapeSQL(ambId)}',
          student_id = '${escapeSQL(studentId)}',
          program_id = '${escapeSQL(programId)}',
          amount_usd = ${commissionAmount},
          status = '${commissionStatus}',
          stage = '${input.newStage}',
          created_at = '${now}';`);

        const txId = generateId();
        const txType = input.newStage === 'registered' ? 'student_registration'
          : input.newStage === 'visa_approved' ? 'student_visa_approved'
          : 'student_departed';
        await dbQueryMultiple(`CREATE transactions:${txId} SET
          ambassador_id = '${escapeSQL(ambId)}',
          type = '${txType}',
          amount_usd = ${commissionAmount},
          amount_try = 0,
          description = '${escapeSQL(student.name)} - ${escapeSQL(STAGE_LABELS_TR[input.newStage] ?? input.newStage)}',
          student_name = '${escapeSQL(student.name)}',
          student_id = '${escapeSQL(studentId)}',
          status = '${commissionStatus}',
          created_at = '${now}';`);

        if (ambassador.parent_id) {
          const parentId = cleanId(ambassador.parent_id);
          const parents = await dbQuery<AmbassadorRecord>(
            `SELECT * FROM ambassadors WHERE id = '${escapeSQL(parentId)}' OR id = 'ambassadors:${escapeSQL(parentId)}' LIMIT 1;`
          );
          if (parents.length > 0) {
            const parent = parents[0];
            const parentCleanId = cleanId(parent.id);
            const networkRate = parent.network_commission_rate ?? 10;
            const networkCommission = commissionAmount * networkRate / 100;

            if (networkCommission > 0) {
              const netCommId = generateId();
              await dbQueryMultiple(`CREATE commissions:${netCommId} SET
                ambassador_id = '${escapeSQL(parentCleanId)}',
                student_id = '${escapeSQL(studentId)}',
                program_id = '${escapeSQL(programId)}',
                amount_usd = ${networkCommission},
                status = '${commissionStatus}',
                stage = '${input.newStage}',
                type = 'network',
                created_at = '${now}';`);

              const netTxId = generateId();
              await dbQueryMultiple(`CREATE transactions:${netTxId} SET
                ambassador_id = '${escapeSQL(parentCleanId)}',
                type = 'referral_commission',
                amount_usd = ${networkCommission},
                amount_try = 0,
                description = 'Ağ komisyonu: ${escapeSQL(student.name)} (${escapeSQL(ambassador.first_name)} ${escapeSQL(ambassador.last_name)} üzerinden)',
                student_name = '${escapeSQL(student.name)}',
                status = '${commissionStatus}',
                created_at = '${now}';`);
            }
          }
        }
      }

      const stageLabelTr = STAGE_LABELS_TR[input.newStage] ?? input.newStage;
      const notifId = generateId();
      await dbQueryMultiple(`CREATE notifications:${notifId} SET
        ambassador_id = 'ambassadors:${escapeSQL(ambId)}',
        type = 'student_update',
        title = 'Öğrenci Aşama Güncellemesi',
        message = 'Öğrenciniz ${escapeSQL(student.name)} ${escapeSQL(stageLabelTr)} aşamasına geçti',
        read = false,
        created_at = '${now}';`);

      return {
        success: true,
        message: 'Öğrenci aşaması güncellendi',
        commissionMessage,
        commissionAmount,
      };
    }),

  getAllStudents: publicProcedure
    .input(z.object({
      token: z.string(),
      stage: z.string().optional(),
      search: z.string().optional(),
      ambassadorId: z.string().optional(),
    }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting all students");
      verifyAdmin(input.token);

      let conditions = ['1=1'];
      if (input.stage && input.stage !== 'all') {
        conditions.push(`stage = '${escapeSQL(input.stage)}'`);
      }
      if (input.search && input.search.trim()) {
        const s = escapeSQL(input.search.trim().toLowerCase());
        conditions.push(`(string::lowercase(name) CONTAINS '${s}' OR string::lowercase(email) CONTAINS '${s}')`);
      }
      if (input.ambassadorId) {
        conditions.push(`(ambassador_id = '${escapeSQL(input.ambassadorId)}' OR ambassador_id = 'ambassadors:${escapeSQL(input.ambassadorId)}')`);
      }

      const sql = `SELECT * FROM students WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC;`;
      const students = await dbQuery<StudentRecord>(sql);

      const result = [];
      for (const s of students) {
        const ambId = cleanId(s.ambassador_id);
        const ambassador = await dbQuery<AmbassadorRecord>(
          `SELECT first_name, last_name FROM ambassadors WHERE id = '${escapeSQL(ambId)}' LIMIT 1;`
        );
        const amb = ambassador[0];

        result.push({
          id: cleanId(s.id),
          name: s.name,
          email: s.email,
          phone: s.phone,
          program: s.program,
          stage: s.stage,
          country: s.country,
          ambassadorId: ambId,
          ambassadorName: amb ? `${amb.first_name} ${amb.last_name}` : 'Bilinmeyen',
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        });
      }

      return result;
    }),

  getStudentDetail: publicProcedure
    .input(z.object({ token: z.string(), studentId: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting student detail:", input.studentId);
      verifyAdmin(input.token);

      const students = await dbQuery<StudentRecord>(
        `SELECT * FROM students WHERE id = '${escapeSQL(input.studentId)}' OR id = 'students:${escapeSQL(input.studentId)}' LIMIT 1;`
      );

      if (students.length === 0) throw new Error("Öğrenci bulunamadı");

      const student = students[0];
      const studentId = cleanId(student.id);
      const ambId = cleanId(student.ambassador_id);

      const ambassador = await dbQuery<AmbassadorRecord>(
        `SELECT first_name, last_name, email, referral_code FROM ambassadors WHERE id = '${escapeSQL(ambId)}' LIMIT 1;`
      );
      const amb = ambassador[0];

      const pipeline = await dbQuery<{ stage: string; date: string; changed_by: string }>(
        `SELECT * FROM student_pipeline_history WHERE student_id = '${escapeSQL(studentId)}' OR student_id = 'students:${escapeSQL(studentId)}' ORDER BY date ASC;`
      );

      const commissions = await dbQuery<CommissionRecord>(
        `SELECT * FROM commissions WHERE student_id = '${escapeSQL(studentId)}' ORDER BY created_at ASC;`
      );

      return {
        id: studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        program: student.program,
        stage: student.stage,
        country: student.country,
        notes: student.notes,
        createdAt: student.created_at,
        updatedAt: student.updated_at,
        ambassadorId: ambId,
        ambassadorName: amb ? `${amb.first_name} ${amb.last_name}` : 'Bilinmeyen',
        ambassadorEmail: amb?.email ?? '',
        pipeline: pipeline.map(p => ({
          stage: p.stage,
          date: p.date,
          changedBy: p.changed_by,
        })),
        commissions: commissions.map(c => ({
          id: cleanId(c.id),
          amountUSD: c.amount_usd,
          status: c.status,
          stage: c.stage,
          createdAt: c.created_at,
        })),
      };
    }),

  createAnnouncement: publicProcedure
    .input(z.object({
      token: z.string(),
      title: z.string().min(1),
      preview: z.string().min(1),
      content: z.string().min(1),
      imageUrl: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Creating announcement:", input.title);
      verifyAdmin(input.token);
      const now = nowISO();
      const id = generateId();

      const imageUrlVal = input.imageUrl ? `'${escapeSQL(input.imageUrl)}'` : 'NONE';
      await dbQueryMultiple(`CREATE announcements:${id} SET
        title = '${escapeSQL(input.title)}',
        preview = '${escapeSQL(input.preview)}',
        content = '${escapeSQL(input.content)}',
        image_url = ${imageUrlVal},
        created_at = '${now}';`);

      const activeAmbassadors = await dbQuery<AmbassadorRecord>(
        `SELECT id FROM ambassadors WHERE account_status = 'active';`
      );

      for (const amb of activeAmbassadors) {
        const ambId = cleanId(amb.id);
        const notifId = generateId();
        await dbQueryMultiple(`CREATE notifications:${notifId} SET
          ambassador_id = 'ambassadors:${escapeSQL(ambId)}',
          type = 'announcement',
          title = '${escapeSQL(input.title)}',
          message = '${escapeSQL(input.preview)}',
          read = false,
          created_at = '${now}';`);
      }

      return { success: true };
    }),

  deleteAnnouncement: publicProcedure
    .input(z.object({ token: z.string(), announcementId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Deleting announcement:", input.announcementId);
      verifyAdmin(input.token);

      await dbQueryMultiple(
        `DELETE announcements:${escapeSQL(input.announcementId)};`
      );

      return { success: true };
    }),

  getAnnouncements: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Admin] Getting announcements");
      verifyAdmin(input.token);

      const announcements = await dbQuery<AnnouncementRecord>(
        `SELECT * FROM announcements ORDER BY created_at DESC;`
      );

      return announcements.map(a => ({
        id: cleanId(a.id),
        title: a.title,
        preview: a.preview,
        content: a.content,
        imageUrl: a.image_url,
        createdAt: a.created_at,
      }));
    }),

  updateCompassPoints: publicProcedure
    .input(z.object({
      token: z.string(),
      ambassadorId: z.string(),
      points: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Updating compass points for:", input.ambassadorId, "by", input.points);
      verifyAdmin(input.token);
      const now = nowISO();

      const ambassadors = await dbQuery<AmbassadorRecord>(
        `SELECT compass_points FROM ambassadors WHERE id = '${escapeSQL(input.ambassadorId)}' OR id = 'ambassadors:${escapeSQL(input.ambassadorId)}' LIMIT 1;`
      );

      if (ambassadors.length === 0) throw new Error("Elçi bulunamadı");

      const currentPoints = ambassadors[0].compass_points ?? 0;
      const newTotal = currentPoints + input.points;

      await dbQueryMultiple(
        `UPDATE ambassadors:${escapeSQL(input.ambassadorId)} SET compass_points = ${newTotal}, updated_at = '${now}';`
      );

      const action = input.points >= 0 ? 'eklendi' : 'çıkarıldı';
      const absPoints = Math.abs(input.points);
      const notifId = generateId();
      await dbQueryMultiple(`CREATE notifications:${notifId} SET
        ambassador_id = 'ambassadors:${escapeSQL(input.ambassadorId)}',
        type = 'announcement',
        title = 'Compass Points Güncellemesi',
        message = '${absPoints} Compass Points ${action}: ${escapeSQL(input.reason)}',
        read = false,
        created_at = '${now}';`);

      return { success: true, newTotal };
    }),

  updateAmbassadorType: publicProcedure
    .input(z.object({
      token: z.string(),
      ambassadorId: z.string(),
      newType: z.enum(['bronze', 'silver', 'gold', 'platinum', 'diamond']),
    }))
    .mutation(async ({ input }) => {
      console.log("[Admin] Updating ambassador type:", input.ambassadorId, "to", input.newType);
      verifyAdmin(input.token);
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE ambassadors:${escapeSQL(input.ambassadorId)} SET type = '${input.newType}', updated_at = '${now}';`
      );

      const typeLabelTr = AMBASSADOR_TYPE_LABELS_TR[input.newType] ?? input.newType;
      const notifId = generateId();
      await dbQueryMultiple(`CREATE notifications:${notifId} SET
        ambassador_id = 'ambassadors:${escapeSQL(input.ambassadorId)}',
        type = 'announcement',
        title = 'Seviye Güncellemesi',
        message = 'Seviyeniz ${escapeSQL(typeLabelTr)} olarak güncellendi!',
        read = false,
        created_at = '${now}';`);

      return { success: true };
    }),
});
