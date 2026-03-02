import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { dbQuery, dbQueryMultiple } from "@/lib/db";

function decodeToken(token: string): { id: string; email: string; role: string; exp: number } | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    if (!decoded.id || !decoded.email || !decoded.role || !decoded.exp) return null;
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
  if (!decoded) throw new Error("Geçersiz oturum bilgisi");
  if (decoded.exp < Date.now()) throw new Error("Oturum süresi dolmuş");
  return decoded;
}

interface NotificationRecord {
  id: string;
  ambassador_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  student_id: string | null;
  created_at: string;
}

export const notificationsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Notifications] Fetching notifications");
      const { id } = validateToken(input.token);

      const notifications = await dbQuery<NotificationRecord>(
        `SELECT * FROM notifications WHERE ambassador_id = '${escapeSQL(id)}' OR ambassador_id = 'ambassadors:${escapeSQL(id)}' ORDER BY created_at DESC;`
      );

      return notifications.map((n) => ({
        id: typeof n.id === "string" && n.id.includes(":") ? n.id.split(":")[1] : n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        date: n.created_at,
        read: n.read ?? false,
        studentId: n.student_id ? (typeof n.student_id === "string" && n.student_id.includes(":") ? n.student_id.split(":")[1] : n.student_id) : undefined,
      }));
    }),

  markAsRead: publicProcedure
    .input(z.object({ token: z.string(), notificationId: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Notifications] Marking as read:", input.notificationId);
      validateToken(input.token);

      await dbQueryMultiple(
        `UPDATE notifications SET read = true WHERE id = 'notifications:${escapeSQL(input.notificationId)}' OR id = '${escapeSQL(input.notificationId)}';`
      );

      return { success: true };
    }),

  markAllAsRead: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      console.log("[Notifications] Marking all as read");
      const { id } = validateToken(input.token);

      await dbQueryMultiple(
        `UPDATE notifications SET read = true WHERE (ambassador_id = '${escapeSQL(id)}' OR ambassador_id = 'ambassadors:${escapeSQL(id)}') AND read = false;`
      );

      return { success: true };
    }),

  getUnreadCount: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { id } = validateToken(input.token);

      const result = await dbQuery<{ count: number }>(
        `SELECT count() FROM notifications WHERE (ambassador_id = '${escapeSQL(id)}' OR ambassador_id = 'ambassadors:${escapeSQL(id)}') AND read = false GROUP ALL;`
      );

      return { unreadCount: result[0]?.count ?? 0 };
    }),
});
