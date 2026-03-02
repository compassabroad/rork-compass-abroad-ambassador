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

interface AmbassadorRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  city: string;
  type: string;
  category: string;
  sub_type: string;
  company_name: string | null;
  tax_number: string | null;
  tax_office: string | null;
  parent_id: string | null;
  referral_code: string;
  account_status: string;
  role: string;
  compass_points: number;
  network_commission_rate: number;
  kvkk_consent: boolean;
  privacy_policy_consent: boolean;
  terms_consent: boolean;
  profile_photo: string | null;
  pending_first_name: string | null;
  pending_last_name: string | null;
  name_change_request_date: string | null;
  birth_date: string | null;
  tc_identity: string | null;
  created_at: string;
  updated_at: string;
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

export const profileRouter = createTRPCRouter({
  get: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Profile] get called");
      const { id } = validateToken(input.token);

      const results = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(id)}' LIMIT 1;`
      );

      if (results.length === 0) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const amb = results[0];

      const bankAccounts = await dbQuery<BankAccountRecord>(
        `SELECT * FROM bank_accounts WHERE ambassador_id = '${escapeSQL(id)}' ORDER BY is_default DESC, submitted_at DESC;`
      );

      console.log("[Profile] Fetched profile for:", amb.email, "bank accounts:", bankAccounts.length);

      return {
        id: amb.id,
        email: amb.email,
        firstName: amb.first_name,
        lastName: amb.last_name,
        phone: amb.phone,
        city: amb.city,
        type: amb.type,
        category: amb.category,
        subType: amb.sub_type,
        companyName: amb.company_name,
        taxNumber: amb.tax_number,
        taxOffice: amb.tax_office,
        parentId: amb.parent_id,
        referralCode: amb.referral_code,
        accountStatus: amb.account_status,
        role: amb.role,
        compassPoints: amb.compass_points,
        networkCommissionRate: amb.network_commission_rate,
        kvkkConsent: amb.kvkk_consent,
        privacyPolicyConsent: amb.privacy_policy_consent,
        termsConsent: amb.terms_consent,
        profilePhoto: amb.profile_photo,
        pendingFirstName: amb.pending_first_name,
        pendingLastName: amb.pending_last_name,
        nameChangeRequestDate: amb.name_change_request_date,
        birthDate: amb.birth_date,
        tcIdentity: amb.tc_identity,
        createdAt: amb.created_at,
        updatedAt: amb.updated_at,
        bankAccounts: bankAccounts.map((ba) => ({
          id: ba.id,
          iban: ba.iban,
          bankName: ba.bank_name,
          isDefault: ba.is_default,
          status: ba.status,
          submittedAt: ba.submitted_at,
          approvedAt: ba.approved_at,
        })),
      };
    }),

  update: publicProcedure
    .input(z.object({
      token: z.string(),
      phone: z.string().optional(),
      city: z.string().optional(),
      birthDate: z.string().optional(),
      tcIdentity: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Profile] update called");
      const { id } = validateToken(input.token);

      const updates: string[] = [];

      if (input.phone !== undefined) {
        updates.push(`phone = '${escapeSQL(input.phone)}'`);
      }
      if (input.city !== undefined) {
        updates.push(`city = '${escapeSQL(input.city)}'`);
      }
      if (input.birthDate !== undefined) {
        updates.push(`birth_date = '${escapeSQL(input.birthDate)}'`);
      }
      if (input.tcIdentity !== undefined) {
        updates.push(`tc_identity = '${escapeSQL(input.tcIdentity)}'`);
      }

      if (updates.length === 0) {
        throw new Error("Güncellenecek alan bulunamadı");
      }

      updates.push(`updated_at = '${nowISO()}'`);

      await dbQueryMultiple(
        `UPDATE ambassadors SET ${updates.join(", ")} WHERE id = '${escapeSQL(id)}';`
      );

      console.log("[Profile] Updated fields:", updates.length);

      const updated = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(id)}' LIMIT 1;`
      );

      if (updated.length === 0) {
        throw new Error("Güncelleme sonrası kullanıcı bulunamadı");
      }

      const amb = updated[0];

      return {
        id: amb.id,
        email: amb.email,
        firstName: amb.first_name,
        lastName: amb.last_name,
        phone: amb.phone,
        city: amb.city,
        type: amb.type,
        birthDate: amb.birth_date,
        tcIdentity: amb.tc_identity,
        updatedAt: amb.updated_at,
      };
    }),

  requestNameChange: publicProcedure
    .input(z.object({
      token: z.string(),
      requestedFirstName: z.string().min(2, "İsim en az 2 karakter olmalı"),
      requestedLastName: z.string().min(2, "Soyisim en az 2 karakter olmalı"),
    }))
    .mutation(async ({ input }) => {
      console.log("[Profile] requestNameChange called");
      const { id } = validateToken(input.token);

      const results = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(id)}' LIMIT 1;`
      );

      if (results.length === 0) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const amb = results[0];
      const now = nowISO();
      const requestId = generateId();

      const sql = `
CREATE name_change_requests:${requestId} SET
  ambassador_id = '${escapeSQL(id)}',
  current_first_name = '${escapeSQL(amb.first_name)}',
  current_last_name = '${escapeSQL(amb.last_name)}',
  requested_first_name = '${escapeSQL(input.requestedFirstName)}',
  requested_last_name = '${escapeSQL(input.requestedLastName)}',
  status = 'pending',
  created_at = '${now}';

UPDATE ambassadors SET
  pending_first_name = '${escapeSQL(input.requestedFirstName)}',
  pending_last_name = '${escapeSQL(input.requestedLastName)}',
  name_change_request_date = '${now}',
  updated_at = '${now}'
WHERE id = '${escapeSQL(id)}';
`;

      await dbQueryMultiple(sql);

      console.log("[Profile] Name change request created:", requestId);

      return {
        success: true,
        message: "İsim değişikliği talebiniz alındı. Admin onayı bekleniyor.",
      };
    }),

  uploadPhoto: publicProcedure
    .input(z.object({
      token: z.string(),
      photoBase64: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Profile] uploadPhoto called");
      const { id } = validateToken(input.token);

      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE ambassadors SET profile_photo = '${escapeSQL(input.photoBase64)}', updated_at = '${now}' WHERE id = '${escapeSQL(id)}';`
      );

      console.log("[Profile] Photo uploaded for:", id);

      return {
        success: true,
        photoUrl: input.photoBase64,
      };
    }),
});
