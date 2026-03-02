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

interface ConversationRecord {
  id: string;
  ambassador_id: string;
  participant_name: string;
  participant_role: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  created_at: string;
}

interface MessageRecord {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read: boolean;
  is_ticket?: boolean;
  ticket_id?: string;
  created_at: string;
}

export const chatRouter = createTRPCRouter({
  getConversations: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      console.log("[Chat] Getting conversations");
      const user = verifyToken(input.token);

      let conversations = await dbQuery<ConversationRecord>(
        `SELECT * FROM conversations WHERE ambassador_id = '${escapeSQL(user.id)}' ORDER BY last_message_time DESC;`
      );

      if (conversations.length === 0) {
        console.log("[Chat] No conversations found, creating default support conversation");
        const now = nowISO();
        const convId = generateId();

        await dbQueryMultiple(`CREATE conversations:${convId} SET
          ambassador_id = '${escapeSQL(user.id)}',
          participant_name = 'Destek Ekibi',
          participant_role = 'Compass Abroad Destek',
          last_message = 'Merhaba! Size nasıl yardımcı olabiliriz?',
          last_message_time = '${now}',
          unread_count = 1,
          created_at = '${now}';`);

        const welcomeMsgId = generateId();
        await dbQueryMultiple(`CREATE messages:${welcomeMsgId} SET
          conversation_id = 'conversations:${convId}',
          sender_id = 'consultant',
          text = 'Merhaba! Compass Abroad Danışman Ekibine hoş geldiniz. Size programlar, komisyonlar, öğrenci süreçleri ve daha fazlası hakkında yardımcı olabiliriz.',
          read = false,
          is_ticket = false,
          created_at = '${now}';`);

        conversations = await dbQuery<ConversationRecord>(
          `SELECT * FROM conversations WHERE ambassador_id = '${escapeSQL(user.id)}' ORDER BY last_message_time DESC;`
        );
      }

      return conversations.map(c => ({
        id: typeof c.id === 'string' && c.id.includes(':') ? c.id.split(':')[1] : c.id,
        participantName: c.participant_name,
        participantRole: c.participant_role,
        lastMessage: c.last_message,
        lastMessageTime: c.last_message_time,
        unreadCount: c.unread_count ?? 0,
      }));
    }),

  getMessages: publicProcedure
    .input(z.object({ token: z.string(), conversationId: z.string() }))
    .query(async ({ input }) => {
      console.log("[Chat] Getting messages for conversation:", input.conversationId);
      const user = verifyToken(input.token);

      const convId = input.conversationId.includes(':') ? input.conversationId : `conversations:${input.conversationId}`;

      const messages = await dbQuery<MessageRecord>(
        `SELECT * FROM messages WHERE conversation_id = '${escapeSQL(convId)}' ORDER BY created_at ASC;`
      );

      await dbQueryMultiple(
        `UPDATE messages SET read = true WHERE conversation_id = '${escapeSQL(convId)}' AND sender_id != '${escapeSQL(user.id)}' AND read = false;`
      );

      const rawConvId = input.conversationId.includes(':') ? input.conversationId.split(':')[1] : input.conversationId;
      await dbQueryMultiple(
        `UPDATE conversations:${escapeSQL(rawConvId)} SET unread_count = 0;`
      );

      return messages.map(m => ({
        id: typeof m.id === 'string' && m.id.includes(':') ? m.id.split(':')[1] : m.id,
        text: m.text,
        senderId: m.sender_id,
        timestamp: m.created_at,
        read: m.read,
        isTicket: m.is_ticket ?? false,
        ticketId: m.ticket_id,
      }));
    }),

  sendMessage: publicProcedure
    .input(z.object({ token: z.string(), conversationId: z.string(), text: z.string().min(1) }))
    .mutation(async ({ input }) => {
      console.log("[Chat] Sending message to conversation:", input.conversationId);
      const user = verifyToken(input.token);
      const now = nowISO();
      const msgId = generateId();

      const convId = input.conversationId.includes(':') ? input.conversationId : `conversations:${input.conversationId}`;
      const rawConvId = input.conversationId.includes(':') ? input.conversationId.split(':')[1] : input.conversationId;

      await dbQueryMultiple(`CREATE messages:${msgId} SET
        conversation_id = '${escapeSQL(convId)}',
        sender_id = '${escapeSQL(user.id)}',
        text = '${escapeSQL(input.text)}',
        read = true,
        is_ticket = false,
        created_at = '${now}';`);

      await dbQueryMultiple(
        `UPDATE conversations:${escapeSQL(rawConvId)} SET last_message = '${escapeSQL(input.text.substring(0, 100))}', last_message_time = '${now}';`
      );

      setTimeout(async () => {
        try {
          const replyId = generateId();
          const replyTime = new Date(Date.now() + 2000).toISOString();
          await dbQueryMultiple(`CREATE messages:${replyId} SET
            conversation_id = '${escapeSQL(convId)}',
            sender_id = 'consultant',
            text = 'Mesajınız alındı! Danışmanlarımız en kısa sürede size yanıt verecektir.',
            read = false,
            is_ticket = false,
            created_at = '${replyTime}';`);

          await dbQueryMultiple(
            `UPDATE conversations:${escapeSQL(rawConvId)} SET last_message = 'Mesajınız alındı! Danışmanlarımız en kısa sürede size yanıt verecektir.', last_message_time = '${replyTime}', unread_count = unread_count + 1;`
          );
        } catch (err) {
          console.error("[Chat] Auto-reply failed:", err);
        }
      }, 2000);

      return {
        id: msgId,
        text: input.text,
        senderId: user.id,
        timestamp: now,
        read: true,
        isTicket: false,
      };
    }),

  createTicket: publicProcedure
    .input(z.object({
      token: z.string(),
      subject: z.string(),
      message: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
    }))
    .mutation(async ({ input }) => {
      console.log("[Chat] Creating ticket:", input.subject);
      const user = verifyToken(input.token);
      const now = nowISO();
      const convId = generateId();

      await dbQueryMultiple(`CREATE conversations:${convId} SET
        ambassador_id = '${escapeSQL(user.id)}',
        participant_name = 'Destek - ${escapeSQL(input.subject)}',
        participant_role = 'Destek Talebi (${input.priority})',
        last_message = '${escapeSQL(input.message.substring(0, 100))}',
        last_message_time = '${now}',
        unread_count = 0,
        created_at = '${now}';`);

      const msgId = generateId();
      await dbQueryMultiple(`CREATE messages:${msgId} SET
        conversation_id = 'conversations:${convId}',
        sender_id = '${escapeSQL(user.id)}',
        text = '${escapeSQL(input.message)}',
        read = true,
        is_ticket = true,
        created_at = '${now}';`);

      return { success: true, conversationId: convId };
    }),

  getUnreadCount: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const user = verifyToken(input.token);

      const result = await dbQuery<{ total: number }>(
        `SELECT math::sum(unread_count) as total FROM conversations WHERE ambassador_id = '${escapeSQL(user.id)}' GROUP ALL;`
      );

      const unreadCount = result[0]?.total ?? 0;
      console.log("[Chat] Unread count for user:", user.id, "=", unreadCount);

      return { unreadCount };
    }),
});
