import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery, dbQueryMultiple, nowISO } from "@/lib/db";

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

function verifyToken(token: string): { id: string; email: string; role: string } {
  const decoded = decodeToken(token);
  if (!decoded) {
    throw new Error("Geçersiz oturum bilgisi");
  }
  if (decoded.exp < Date.now()) {
    throw new Error("Oturum süresi dolmuş");
  }
  return { id: decoded.id, email: decoded.email, role: decoded.role };
}

interface TeamMemberRecord {
  id: string;
  name: string;
  title: string;
  expertise_areas: string;
  languages: string;
  availability: string;
  email: string;
  phone: string;
  created_at: string;
}

const SEED_TEAM_MEMBERS = [
  {
    id: 'team1',
    name: 'Elif Yılmaz',
    title: 'Kıdemli Eğitim Danışmanı',
    expertise_areas: JSON.stringify(['bachelor', 'masters', 'high_school']),
    languages: JSON.stringify(['Türkçe', 'İngilizce', 'Almanca']),
    availability: 'available',
    email: 'elif.yilmaz@compassabroad.com',
    phone: '+90 212 555 0101',
  },
  {
    id: 'team2',
    name: 'Murat Demir',
    title: 'Amerika Programları Uzmanı',
    expertise_areas: JSON.stringify(['camp_usa', 'work_and_study', 'group_summer_school']),
    languages: JSON.stringify(['Türkçe', 'İngilizce']),
    availability: 'busy',
    email: 'murat.demir@compassabroad.com',
    phone: '+90 212 555 0102',
  },
  {
    id: 'team3',
    name: 'Zehra Kaya',
    title: 'Lise Programları Danışmanı',
    expertise_areas: JSON.stringify(['high_school', 'canada_online_highschool']),
    languages: JSON.stringify(['Türkçe', 'İngilizce', 'Fransızca']),
    availability: 'available',
    email: 'zehra.kaya@compassabroad.com',
    phone: '+90 212 555 0103',
  },
  {
    id: 'team4',
    name: 'Can Aksoy',
    title: 'Dil Okulları Koordinatörü',
    expertise_areas: JSON.stringify(['language_education', 'canada_language', 'individual_summer_school']),
    languages: JSON.stringify(['Türkçe', 'İngilizce', 'İspanyolca']),
    availability: 'available',
    email: 'can.aksoy@compassabroad.com',
    phone: '+90 212 555 0104',
  },
  {
    id: 'team5',
    name: 'Selin Öztürk',
    title: 'Staj & Öğretmenlik Danışmanı',
    expertise_areas: JSON.stringify(['internship', 'paid_teaching']),
    languages: JSON.stringify(['Türkçe', 'İngilizce', 'Hollandaca']),
    availability: 'busy',
    email: 'selin.ozturk@compassabroad.com',
    phone: '+90 212 555 0105',
  },
  {
    id: 'team6',
    name: 'Burak Şen',
    title: 'Vize İşlemleri Uzmanı',
    expertise_areas: JSON.stringify(['visa_consulting', 'bachelor', 'masters']),
    languages: JSON.stringify(['Türkçe', 'İngilizce']),
    availability: 'available',
    email: 'burak.sen@compassabroad.com',
    phone: '+90 212 555 0106',
  },
];

async function ensureTeamTable(): Promise<void> {
  const existing = await dbQuery<TeamMemberRecord>(
    `SELECT * FROM team_members LIMIT 1;`
  ).catch(() => []);

  if (existing.length === 0) {
    console.log("[Team] Seeding team_members table");
    const now = nowISO();
    for (const member of SEED_TEAM_MEMBERS) {
      await dbQueryMultiple(`CREATE team_members:${member.id} SET
        name = '${member.name}',
        title = '${member.title}',
        expertise_areas = '${member.expertise_areas}',
        languages = '${member.languages}',
        availability = '${member.availability}',
        email = '${member.email}',
        phone = '${member.phone}',
        created_at = '${now}';`);
    }
    console.log("[Team] Team members seeded successfully");
  }
}

export const teamRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Team] Listing team members");
      verifyToken(input.token);

      await ensureTeamTable();

      const members = await dbQuery<TeamMemberRecord>(
        `SELECT * FROM team_members ORDER BY name ASC;`
      );

      return members.map(m => {
        let expertiseAreas: string[] = [];
        let languages: string[] = [];

        try {
          expertiseAreas = typeof m.expertise_areas === 'string' ? JSON.parse(m.expertise_areas) : (m.expertise_areas as unknown as string[]) ?? [];
        } catch {
          expertiseAreas = [];
        }

        try {
          languages = typeof m.languages === 'string' ? JSON.parse(m.languages) : (m.languages as unknown as string[]) ?? [];
        } catch {
          languages = [];
        }

        return {
          id: typeof m.id === 'string' && m.id.includes(':') ? m.id.split(':')[1] : m.id,
          name: m.name,
          title: m.title,
          expertiseAreas,
          languages,
          availability: m.availability as 'available' | 'busy',
          email: m.email,
          phone: m.phone,
        };
      });
    }),
});
