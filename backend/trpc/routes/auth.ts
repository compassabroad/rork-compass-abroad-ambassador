import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery, dbQueryMultiple, generateId, generateReferralCode, nowISO } from "@/lib/db";
import { hashPassword } from "./db-setup";

const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || "noreply@compassabroad.com.tr";
const FROM_NAME = process.env.MAILJET_FROM_NAME || "Compass Abroad";

function createToken(payload: { id: string; email: string; role: string }): string {
  const tokenData = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(tokenData)).toString("base64");
}

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

async function sendMailjet(params: {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}): Promise<void> {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    console.error("[Auth] Mailjet credentials not configured");
    throw new Error("E-posta servisi yapılandırılmamış");
  }

  const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      Messages: [
        {
          From: { Email: FROM_EMAIL, Name: FROM_NAME },
          To: [{ Email: params.to, Name: params.toName }],
          Subject: params.subject,
          HTMLPart: params.htmlBody,
          TextPart: params.textBody,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Auth] Mailjet send failed:", response.status, errorText);
    throw new Error("E-posta gönderilemedi");
  }

  const result = await response.json();
  console.log("[Auth] Mailjet response:", JSON.stringify(result));
}

interface AmbassadorRecord {
  id: string;
  email: string;
  password_hash: string;
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
  kvkk_consent_date: string | null;
  privacy_policy_consent: boolean;
  terms_consent: boolean;
  profile_photo: string | null;
  pending_first_name: string | null;
  pending_last_name: string | null;
  name_change_request_date: string | null;
  birth_date: string | null;
  tc_identity: string | null;
  reset_code: string | null;
  reset_code_expires: string | null;
  created_at: string;
  updated_at: string;
}

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(2, "İsim en az 2 karakter olmalı"),
        lastName: z.string().min(2, "Soyisim en az 2 karakter olmalı"),
        email: z.string().email("Geçerli bir e-posta adresi girin"),
        phone: z.string().min(10, "Geçerli bir telefon numarası girin"),
        password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
        city: z.string(),
        category: z.enum(["individual", "corporate"]),
        subType: z.string(),
        companyName: z.string().optional(),
        taxNumber: z.string().optional(),
        taxOffice: z.string().optional(),
        kvkkConsent: z.literal(true, { message: "KVKK onayı gereklidir" }),
        privacyPolicyConsent: z.literal(true, { message: "Gizlilik politikası onayı gereklidir" }),
        termsConsent: z.literal(true, { message: "Kullanım koşulları onayı gereklidir" }),
        parentReferralCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Auth] Register attempt for:", input.email);

      const existing = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE email = '${escapeSQL(input.email)}' LIMIT 1;`
      );

      if (existing.length > 0) {
        throw new Error("Bu e-posta adresi zaten kayıtlı");
      }

      if (input.category === "corporate" && !input.companyName) {
        throw new Error("Kurumsal hesaplar için şirket adı zorunludur");
      }

      const passwordHash = hashPassword(input.password);

      let referralCode = generateReferralCode();
      let codeExists = true;
      let attempts = 0;
      while (codeExists && attempts < 10) {
        const check = await dbQuery<AmbassadorRecord>(
          `SELECT * FROM ambassadors WHERE referral_code = '${referralCode}' LIMIT 1;`
        );
        if (check.length === 0) {
          codeExists = false;
        } else {
          referralCode = generateReferralCode();
          attempts++;
        }
      }

      let parentId = "NONE";
      if (input.parentReferralCode) {
        const parent = await dbQuery<AmbassadorRecord>(
          `SELECT * FROM ambassadors WHERE referral_code = '${escapeSQL(input.parentReferralCode)}' LIMIT 1;`
        );
        if (parent.length === 0) {
          throw new Error("Geçersiz referans kodu");
        }
        if (parent[0].account_status !== "active") {
          throw new Error("Referans veren elçinin hesabı aktif değil");
        }
        parentId = `'${escapeSQL(parent[0].id)}'`;
      }

      const now = nowISO();
      const id = generateId();

      const companyNameVal = input.companyName ? `'${escapeSQL(input.companyName)}'` : "NONE";
      const taxNumberVal = input.taxNumber ? `'${escapeSQL(input.taxNumber)}'` : "NONE";
      const taxOfficeVal = input.taxOffice ? `'${escapeSQL(input.taxOffice)}'` : "NONE";

      const sql = `CREATE ambassadors:${id} SET
        email = '${escapeSQL(input.email)}',
        password_hash = '${escapeSQL(passwordHash)}',
        first_name = '${escapeSQL(input.firstName)}',
        last_name = '${escapeSQL(input.lastName)}',
        phone = '${escapeSQL(input.phone)}',
        city = '${escapeSQL(input.city)}',
        type = 'bronze',
        category = '${escapeSQL(input.category)}',
        sub_type = '${escapeSQL(input.subType)}',
        company_name = ${companyNameVal},
        tax_number = ${taxNumberVal},
        tax_office = ${taxOfficeVal},
        parent_id = ${parentId},
        referral_code = '${referralCode}',
        account_status = 'pending_approval',
        role = 'ambassador',
        compass_points = 0,
        network_commission_rate = 10,
        kvkk_consent = true,
        kvkk_consent_date = '${now}',
        privacy_policy_consent = true,
        terms_consent = true,
        profile_photo = NONE,
        pending_first_name = NONE,
        pending_last_name = NONE,
        name_change_request_date = NONE,
        birth_date = NONE,
        tc_identity = NONE,
        reset_code = NONE,
        reset_code_expires = NONE,
        created_at = '${now}',
        updated_at = '${now}';`;

      await dbQueryMultiple(sql);
      console.log("[Auth] Ambassador registered successfully:", id);

      return {
        success: true,
        message: "Kayıt başarılı! Hesabınız onay bekliyor.",
      };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log("[Auth] Login attempt for:", input.email);

        let results: AmbassadorRecord[];
        try {
          results = await dbQuery<AmbassadorRecord>(
            `SELECT * FROM ambassadors WHERE email = '${escapeSQL(input.email)}' LIMIT 1;`
          );
        } catch (dbError) {
          console.error("[Auth] DB query failed during login:", dbError);
          throw new Error("Veritabanı bağlantı hatası. Lütfen tekrar deneyin.");
        }

        if (results.length === 0) {
          throw new Error("E-posta veya şifre hatalı");
        }

        const ambassador = results[0];
        const inputHash = hashPassword(input.password);

        if (ambassador.password_hash !== inputHash) {
          console.log("[Auth] Password mismatch for:", input.email);
          throw new Error("E-posta veya şifre hatalı");
        }

        if (ambassador.account_status === "rejected") {
          throw new Error("Hesabınız reddedilmiş. Destek ile iletişime geçin.");
        }

        if (ambassador.account_status === "suspended") {
          throw new Error("Hesabınız askıya alınmış.");
        }

        const token = createToken({
          id: ambassador.id,
          email: ambassador.email,
          role: ambassador.role,
        });

        console.log("[Auth] Login successful for:", input.email, "status:", ambassador.account_status);

        return {
          token,
          user: {
            id: ambassador.id,
            email: ambassador.email,
            firstName: ambassador.first_name,
            lastName: ambassador.last_name,
            role: ambassador.role,
            accountStatus: ambassador.account_status,
            type: ambassador.type,
            referralCode: ambassador.referral_code,
            city: ambassador.city,
            compassPoints: ambassador.compass_points,
            profilePhoto: ambassador.profile_photo,
          },
        };
      } catch (error) {
        console.error("[Auth] Login error:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    }),

  me: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        console.log("[Auth] Fetching profile with token");

        const decoded = decodeToken(input.token);
        if (!decoded) {
          throw new Error("Geçersiz oturum bilgisi");
        }

        if (decoded.exp < Date.now()) {
          throw new Error("Oturum süresi dolmuş");
        }

        const results = await dbQuery<AmbassadorRecord>(
          `SELECT * FROM ambassadors WHERE id = '${escapeSQL(decoded.id)}' LIMIT 1;`
        );

        if (results.length === 0) {
          throw new Error("Kullanıcı bulunamadı");
        }

        const ambassador = results[0];

        let studentsCount = 0;
        let bankAccountsCount = 0;
        let subAmbassadorsCount = 0;

        try {
          const studentsResult = await dbQuery<{ count: number }>(
            `SELECT count() FROM students WHERE ambassador_id = '${escapeSQL(ambassador.id)}' GROUP ALL;`
          );
          studentsCount = studentsResult[0]?.count ?? 0;
        } catch (e) {
          console.error("[Auth] Failed to count students:", e);
        }

        try {
          const bankAccountsResult = await dbQuery<{ count: number }>(
            `SELECT count() FROM bank_accounts WHERE ambassador_id = '${escapeSQL(ambassador.id)}' GROUP ALL;`
          );
          bankAccountsCount = bankAccountsResult[0]?.count ?? 0;
        } catch (e) {
          console.error("[Auth] Failed to count bank accounts:", e);
        }

        try {
          const subAmbassadorsResult = await dbQuery<{ count: number }>(
            `SELECT count() FROM ambassadors WHERE parent_id = '${escapeSQL(ambassador.id)}' GROUP ALL;`
          );
          subAmbassadorsCount = subAmbassadorsResult[0]?.count ?? 0;
        } catch (e) {
          console.error("[Auth] Failed to count sub-ambassadors:", e);
        }

        console.log("[Auth] Profile fetched for:", ambassador.email);

        return {
          id: ambassador.id,
          email: ambassador.email,
          firstName: ambassador.first_name,
          lastName: ambassador.last_name,
          phone: ambassador.phone,
          role: ambassador.role,
          accountStatus: ambassador.account_status,
          type: ambassador.type,
          category: ambassador.category,
          subType: ambassador.sub_type,
          companyName: ambassador.company_name,
          referralCode: ambassador.referral_code,
          city: ambassador.city,
          compassPoints: ambassador.compass_points,
          profilePhoto: ambassador.profile_photo,
          birthDate: ambassador.birth_date,
          tcIdentity: ambassador.tc_identity,
          parentId: ambassador.parent_id,
          networkCommissionRate: ambassador.network_commission_rate,
          kvkkConsent: ambassador.kvkk_consent,
          privacyPolicyConsent: ambassador.privacy_policy_consent,
          termsConsent: ambassador.terms_consent,
          createdAt: ambassador.created_at,
          studentsReferred: studentsCount,
          bankAccountsCount: bankAccountsCount,
          subAmbassadorsCount: subAmbassadorsCount,
        };
      } catch (error) {
        console.error("[Auth] me() error:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    }),

  changePassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        currentPassword: z.string(),
        newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Auth] Change password attempt");

      const decoded = decodeToken(input.token);
      if (!decoded) {
        throw new Error("Geçersiz oturum bilgisi");
      }

      if (decoded.exp < Date.now()) {
        throw new Error("Oturum süresi dolmuş");
      }

      const results = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE id = '${escapeSQL(decoded.id)}' LIMIT 1;`
      );

      if (results.length === 0) {
        throw new Error("Kullanıcı bulunamadı");
      }

      const ambassador = results[0];
      const currentHash = hashPassword(input.currentPassword);

      if (ambassador.password_hash !== currentHash) {
        throw new Error("Mevcut şifre hatalı");
      }

      const newHash = hashPassword(input.newPassword);
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE ambassadors SET password_hash = '${escapeSQL(newHash)}', updated_at = '${now}' WHERE id = '${escapeSQL(decoded.id)}';`
      );

      console.log("[Auth] Password changed for:", ambassador.email);

      return {
        success: true,
        message: "Şifre başarıyla değiştirildi",
      };
    }),

  forgotPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email("Geçerli bir e-posta adresi girin"),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Auth] Forgot password for:", input.email);

      const results = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE email = '${escapeSQL(input.email)}' LIMIT 1;`
      );

      if (results.length === 0) {
        return {
          success: true,
          message: "Eğer bu e-posta adresi kayıtlıysa, sıfırlama kodu gönderildi.",
        };
      }

      const ambassador = results[0];

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE ambassadors SET reset_code = '${resetCode}', reset_code_expires = '${expiresAt}', updated_at = '${now}' WHERE id = '${escapeSQL(ambassador.id)}';`
      );

      try {
        const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background-color:#f5f5f5;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px 16px 0 0;">
              <h1 style="margin:0;color:#D4AF37;font-size:28px;font-weight:700;">Compass Abroad</h1>
              <p style="margin:8px 0 0;color:#ffffff;font-size:14px;">Şifre Sıfırlama</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 20px;color:#1a1a2e;font-size:22px;">Merhaba ${ambassador.first_name},</h2>
              <p style="margin:0 0 20px;color:#4a4a4a;font-size:16px;line-height:1.6;">
                Şifre sıfırlama talebiniz alındı. Aşağıdaki kodu kullanarak şifrenizi sıfırlayabilirsiniz:
              </p>
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:20px;background-color:#f8f9fa;border-radius:12px;">
                    <span style="font-size:36px;font-weight:700;color:#1a1a2e;letter-spacing:8px;">${resetCode}</span>
                  </td>
                </tr>
              </table>
              <p style="margin:20px 0 0;color:#888;font-size:14px;line-height:1.6;">
                Bu kod 15 dakika süreyle geçerlidir. Bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;text-align:center;background-color:#f8f9fa;border-radius:0 0 16px 16px;">
              <p style="margin:0;color:#888;font-size:12px;">&copy; ${new Date().getFullYear()} Compass Abroad. Tüm hakları saklıdır.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

        const textBody = `Merhaba ${ambassador.first_name},\n\nŞifre sıfırlama kodunuz: ${resetCode}\n\nBu kod 15 dakika süreyle geçerlidir.\n\nBu talebi siz yapmadıysanız, bu mesajı görmezden gelebilirsiniz.\n\n© ${new Date().getFullYear()} Compass Abroad`;

        await sendMailjet({
          to: ambassador.email,
          toName: `${ambassador.first_name} ${ambassador.last_name}`,
          subject: "Compass Abroad - Şifre Sıfırlama Kodu",
          htmlBody,
          textBody,
        });

        console.log("[Auth] Reset code sent to:", ambassador.email);
      } catch (error) {
        console.error("[Auth] Failed to send reset email:", error);
        throw new Error("E-posta gönderilemedi. Lütfen tekrar deneyin.");
      }

      return {
        success: true,
        message: "Sıfırlama kodu e-posta adresinize gönderildi",
      };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().min(6).max(6),
        newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Auth] Reset password attempt for:", input.email);

      const results = await dbQuery<AmbassadorRecord>(
        `SELECT * FROM ambassadors WHERE email = '${escapeSQL(input.email)}' LIMIT 1;`
      );

      if (results.length === 0) {
        throw new Error("Geçersiz sıfırlama talebi");
      }

      const ambassador = results[0];

      if (!ambassador.reset_code || ambassador.reset_code !== input.code) {
        throw new Error("Geçersiz sıfırlama kodu");
      }

      if (!ambassador.reset_code_expires || new Date(ambassador.reset_code_expires) < new Date()) {
        throw new Error("Sıfırlama kodunun süresi dolmuş. Lütfen yeni kod talep edin.");
      }

      const newHash = hashPassword(input.newPassword);
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE ambassadors SET password_hash = '${escapeSQL(newHash)}', reset_code = NONE, reset_code_expires = NONE, updated_at = '${now}' WHERE id = '${escapeSQL(ambassador.id)}';`
      );

      console.log("[Auth] Password reset successful for:", ambassador.email);

      return {
        success: true,
        message: "Şifreniz başarıyla sıfırlandı. Giriş yapabilirsiniz.",
      };
    }),
});
