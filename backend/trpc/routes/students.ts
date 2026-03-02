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

interface PipelineRecord {
  id: string;
  student_id: string;
  stage: string;
  date: string;
  changed_by: string | null;
  created_at: string;
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

interface AmbassadorCommissionRecord {
  id: string;
  ambassador_id: string;
  program_id: string;
  custom_commission_usd: number | null;
  use_custom: boolean;
}

async function getCommissionAmount(ambassadorId: string, programId: string): Promise<number> {
  const customCommissions = await dbQuery<AmbassadorCommissionRecord>(
    `SELECT * FROM ambassador_commissions WHERE ambassador_id = '${escapeSQL(ambassadorId)}' AND program_id = 'programs:${escapeSQL(programId)}' AND use_custom = true LIMIT 1;`
  );

  if (customCommissions.length > 0 && customCommissions[0].custom_commission_usd !== null) {
    console.log(`[Students] Using custom commission for ${ambassadorId}/${programId}: $${customCommissions[0].custom_commission_usd}`);
    return customCommissions[0].custom_commission_usd;
  }

  const programs = await dbQuery<ProgramRecord>(
    `SELECT * FROM programs:${escapeSQL(programId)} LIMIT 1;`
  );

  if (programs.length > 0) {
    console.log(`[Students] Using default commission for ${programId}: $${programs[0].default_commission_usd}`);
    return programs[0].default_commission_usd;
  }

  console.log(`[Students] No commission found for ${programId}, defaulting to 0`);
  return 0;
}

function generateInvitationToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const studentsRouter = createTRPCRouter({
  listPrograms: publicProcedure.query(async () => {
    console.log("[Programs] Fetching all programs");
    const programs = await dbQuery<ProgramRecord>(`SELECT * FROM programs ORDER BY name ASC;`);

    return programs.map((p) => {
      const pid = typeof p.id === "string" && p.id.includes(":") ? p.id.split(":")[1] : p.id;
      let countries: string[] = [];
      try {
        countries = typeof p.countries === "string" ? JSON.parse(p.countries) : Array.isArray(p.countries) ? p.countries : [];
      } catch {
        countries = [];
      }
      return {
        id: pid,
        name: p.name,
        nameEn: p.name_en,
        description: p.description,
        commission: p.default_commission_usd,
        points: p.points,
        icon: p.icon,
        countries,
        duration: p.duration,
      };
    });
  }),

  list: publicProcedure
    .input(z.object({
      token: z.string(),
      stage: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      console.log("[Students] list called, stage:", input.stage, "search:", input.search);
      const { id } = validateToken(input.token);

      let sql = `SELECT * FROM students WHERE ambassador_id = '${escapeSQL(id)}'`;

      if (input.stage) {
        sql += ` AND stage = '${escapeSQL(input.stage)}'`;
      }

      if (input.search) {
        sql += ` AND string::lowercase(name) CONTAINS '${escapeSQL(input.search.toLowerCase())}'`;
      }

      sql += ` ORDER BY created_at DESC;`;

      const students = await dbQuery<StudentRecord>(sql);

      const programs = await dbQuery<ProgramRecord>(`SELECT * FROM programs;`);
      const programMap = new Map<string, ProgramRecord>();
      for (const p of programs) {
        const pid = p.id.includes(":") ? p.id.split(":")[1] : p.id;
        programMap.set(pid, p);
      }

      const result = students.map((s) => {
        const prog = programMap.get(s.program);
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone,
          program: s.program,
          programName: prog?.name || s.program,
          stage: s.stage,
          country: s.country,
          invitationStatus: s.invitation_status,
          invitationToken: s.invitation_token,
          invitedAt: s.invited_at,
          notes: s.notes,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        };
      });

      console.log("[Students] Returned", result.length, "students");
      return result;
    }),

  create: publicProcedure
    .input(z.object({
      token: z.string(),
      name: z.string().min(2, "İsim en az 2 karakter olmalı"),
      email: z.string().email("Geçerli bir e-posta adresi girin"),
      phone: z.string().min(5, "Geçerli bir telefon numarası girin"),
      program: z.string(),
      country: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Students] create called for:", input.name);
      const { id: ambassadorId } = validateToken(input.token);

      const now = nowISO();
      const studentId = generateId();
      const pipelineId = generateId();

      const notesVal = input.notes ? `'${escapeSQL(input.notes)}'` : "NONE";

      const sql = `
CREATE students:${studentId} SET
  name = '${escapeSQL(input.name)}',
  email = '${escapeSQL(input.email)}',
  phone = '${escapeSQL(input.phone)}',
  program = '${escapeSQL(input.program)}',
  stage = 'pre_payment',
  country = '${escapeSQL(input.country)}',
  ambassador_id = '${escapeSQL(ambassadorId)}',
  invitation_status = NONE,
  invitation_token = NONE,
  invited_at = NONE,
  notes = ${notesVal},
  created_at = '${now}',
  updated_at = '${now}';

CREATE student_pipeline_history:${pipelineId} SET
  student_id = 'students:${studentId}',
  stage = 'pre_payment',
  date = '${now}',
  changed_by = '${escapeSQL(ambassadorId)}',
  created_at = '${now}';
`;

      await dbQueryMultiple(sql);

      const commissionAmount = await getCommissionAmount(ambassadorId, input.program);

      if (commissionAmount > 0) {
        const commissionId = generateId();
        await dbQueryMultiple(`
CREATE commissions:${commissionId} SET
  ambassador_id = '${escapeSQL(ambassadorId)}',
  student_id = 'students:${studentId}',
  program = '${escapeSQL(input.program)}',
  amount_usd = ${commissionAmount},
  stage = 'pre_payment',
  status = 'pending',
  created_at = '${now}';
`);
        console.log("[Students] Commission record created: $" + commissionAmount);
      }

      console.log("[Students] Student created:", studentId);

      return {
        success: true,
        student: {
          id: `students:${studentId}`,
          name: input.name,
          email: input.email,
          phone: input.phone,
          program: input.program,
          stage: "pre_payment",
          country: input.country,
          notes: input.notes || null,
          createdAt: now,
        },
      };
    }),

  invite: publicProcedure
    .input(z.object({
      token: z.string(),
      name: z.string().min(2),
      email: z.string().email(),
      phone: z.string().min(5),
      program: z.string(),
      country: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Students] invite called for:", input.name);
      const { id: ambassadorId } = validateToken(input.token);

      const now = nowISO();
      const studentId = generateId();
      const invitationToken = generateInvitationToken();
      const notesVal = input.notes ? `'${escapeSQL(input.notes)}'` : "NONE";

      const sql = `
CREATE students:${studentId} SET
  name = '${escapeSQL(input.name)}',
  email = '${escapeSQL(input.email)}',
  phone = '${escapeSQL(input.phone)}',
  program = '${escapeSQL(input.program)}',
  stage = 'pre_payment',
  country = '${escapeSQL(input.country)}',
  ambassador_id = '${escapeSQL(ambassadorId)}',
  invitation_status = 'pending_kvkk',
  invitation_token = '${invitationToken}',
  invited_at = '${now}',
  notes = ${notesVal},
  created_at = '${now}',
  updated_at = '${now}';
`;

      await dbQueryMultiple(sql);

      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || "";
      const invitationLink = `${baseUrl}/student-registration/${invitationToken}`;

      console.log("[Students] Student invited:", studentId, "token:", invitationToken);

      return {
        success: true,
        student: {
          id: `students:${studentId}`,
          name: input.name,
          email: input.email,
          invitationToken,
        },
        invitationLink,
      };
    }),

  resendInvite: publicProcedure
    .input(z.object({
      token: z.string(),
      studentId: z.string(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Students] resendInvite called for:", input.studentId);
      const { id: ambassadorId } = validateToken(input.token);

      const students = await dbQuery<StudentRecord>(
        `SELECT * FROM students WHERE id = '${escapeSQL(input.studentId)}' AND ambassador_id = '${escapeSQL(ambassadorId)}' LIMIT 1;`
      );

      if (students.length === 0) {
        throw new Error("Öğrenci bulunamadı veya bu öğrenci size ait değil");
      }

      const student = students[0];
      const now = nowISO();

      await dbQueryMultiple(
        `UPDATE students SET invited_at = '${now}', updated_at = '${now}' WHERE id = '${escapeSQL(input.studentId)}';`
      );

      console.log("[Students] Invite resent for:", student.name);

      return { success: true };
    }),

  getByInvitationToken: publicProcedure
    .input(z.object({ invitationToken: z.string() }))
    .query(async ({ input }) => {
      console.log("[Students] getByInvitationToken called:", input.invitationToken);

      const students = await dbQuery<StudentRecord>(
        `SELECT * FROM students WHERE invitation_token = '${escapeSQL(input.invitationToken)}' LIMIT 1;`
      );

      if (students.length === 0) {
        throw new Error("Geçersiz veya süresi dolmuş davet linki");
      }

      const student = students[0];
      const programs = await dbQuery<ProgramRecord>(
        `SELECT * FROM programs:${escapeSQL(student.program)} LIMIT 1;`
      );
      const programName = programs.length > 0 ? programs[0].name : student.program;

      return {
        name: student.name,
        email: student.email,
        phone: student.phone,
        program: student.program,
        programName,
        country: student.country,
        invitationStatus: student.invitation_status,
      };
    }),

  completeRegistration: publicProcedure
    .input(z.object({
      invitationToken: z.string(),
      kvkkConsent: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      console.log("[Students] completeRegistration called for token:", input.invitationToken);

      if (!input.kvkkConsent) {
        throw new Error("KVKK onayı gereklidir");
      }

      const students = await dbQuery<StudentRecord>(
        `SELECT * FROM students WHERE invitation_token = '${escapeSQL(input.invitationToken)}' LIMIT 1;`
      );

      if (students.length === 0) {
        throw new Error("Geçersiz veya süresi dolmuş davet linki");
      }

      const student = students[0];
      const studentId = typeof student.id === 'string' && student.id.includes(':') ? student.id.split(':')[1] : student.id;

      if (student.invitation_status === 'completed') {
        throw new Error("Bu davet zaten tamamlanmış");
      }

      const now = nowISO();
      const newStage = student.stage === 'pre_payment' ? 'registered' : student.stage;

      await dbQueryMultiple(`
UPDATE students SET invitation_status = 'completed', stage = '${newStage}', updated_at = '${now}' WHERE id = '${escapeSQL(student.id)}';
`);

      if (newStage !== student.stage) {
        const pipelineId = generateId();
        await dbQueryMultiple(`
CREATE student_pipeline_history:${pipelineId} SET
  student_id = '${escapeSQL(student.id)}',
  stage = '${newStage}',
  date = '${now}',
  changed_by = 'student',
  created_at = '${now}';
`);
      }

      console.log("[Students] Registration completed for:", student.name);
      return { success: true, message: "Kayıt tamamlandı!" };
    }),

  getById: publicProcedure
    .input(z.object({
      token: z.string(),
      studentId: z.string(),
    }))
    .query(async ({ input }) => {
      console.log("[Students] getById called for:", input.studentId);
      const { id: ambassadorId } = validateToken(input.token);

      const students = await dbQuery<StudentRecord>(
        `SELECT * FROM students WHERE id = '${escapeSQL(input.studentId)}' LIMIT 1;`
      );

      if (students.length === 0) {
        throw new Error("Öğrenci bulunamadı");
      }

      const student = students[0];

      const pipeline = await dbQuery<PipelineRecord>(
        `SELECT * FROM student_pipeline_history WHERE student_id = '${escapeSQL(input.studentId)}' ORDER BY created_at ASC;`
      );

      const commissions = await dbQuery<CommissionRecord>(
        `SELECT * FROM commissions WHERE student_id = '${escapeSQL(input.studentId)}' AND ambassador_id = '${escapeSQL(ambassadorId)}';`
      );

      const programs = await dbQuery<ProgramRecord>(
        `SELECT * FROM programs:${escapeSQL(student.program)} LIMIT 1;`
      );

      const programName = programs.length > 0 ? programs[0].name : student.program;

      console.log("[Students] Student details fetched:", student.name);

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        program: student.program,
        programName,
        stage: student.stage,
        country: student.country,
        invitationStatus: student.invitation_status,
        invitationToken: student.invitation_token,
        invitedAt: student.invited_at,
        notes: student.notes,
        createdAt: student.created_at,
        updatedAt: student.updated_at,
        pipeline: pipeline.map((p) => ({
          id: p.id,
          stage: p.stage,
          date: p.date,
          changedBy: p.changed_by,
        })),
        commissions: commissions.map((c) => ({
          id: c.id,
          program: c.program,
          amountUsd: c.amount_usd,
          stage: c.stage,
          status: c.status,
          createdAt: c.created_at,
        })),
      };
    }),
});
