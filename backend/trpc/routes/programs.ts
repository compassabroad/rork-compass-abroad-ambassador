import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery } from "@/lib/db";

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

export const programsRouter = createTRPCRouter({
  list: publicProcedure.query(async () => {
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
});
