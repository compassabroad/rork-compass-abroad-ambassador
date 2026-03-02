import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery } from "@/lib/db";

function decodeToken(token: string): { id: string; email: string; role: string; exp: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (!decoded.id || !decoded.email || !decoded.role || !decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

function validateToken(token: string): { id: string; email: string; role: string } {
  const decoded = decodeToken(token);
  if (!decoded) throw new Error("Geçersiz oturum bilgisi");
  if (decoded.exp < Date.now()) throw new Error("Oturum süresi dolmuş");
  return decoded;
}

interface AnnouncementRecord {
  id: string;
  title: string;
  preview: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export const announcementsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Announcements] Fetching all announcements");
      validateToken(input.token);

      const announcements = await dbQuery<AnnouncementRecord>(
        `SELECT * FROM announcements ORDER BY created_at DESC;`
      );

      return announcements.map((a) => ({
        id: typeof a.id === "string" && a.id.includes(":") ? a.id.split(":")[1] : a.id,
        title: a.title,
        preview: a.preview,
        content: a.content,
        date: a.created_at,
        imageUrl: a.image_url,
        read: false,
      }));
    }),

  getById: publicProcedure
    .input(z.object({ token: z.string(), announcementId: z.string() }))
    .query(async ({ input }) => {
      console.log("[Announcements] Fetching announcement:", input.announcementId);
      validateToken(input.token);

      const results = await dbQuery<AnnouncementRecord>(
        `SELECT * FROM announcements WHERE id = 'announcements:${input.announcementId}' OR id = '${input.announcementId}' LIMIT 1;`
      );

      if (results.length === 0) {
        throw new Error("Duyuru bulunamadı");
      }

      const a = results[0];
      return {
        id: typeof a.id === "string" && a.id.includes(":") ? a.id.split(":")[1] : a.id,
        title: a.title,
        preview: a.preview,
        content: a.content,
        date: a.created_at,
        imageUrl: a.image_url,
        read: true,
      };
    }),
});
