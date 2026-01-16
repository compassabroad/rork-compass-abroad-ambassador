import * as postmark from "postmark";
import * as z from "zod";

import { createTRPCRouter, publicProcedure } from "../create-context";

const getPostmarkClient = () => {
  const apiKey = process.env.POSTMARK_API_KEY;
  if (!apiKey) {
    throw new Error("POSTMARK_API_KEY is not configured");
  }
  return new postmark.ServerClient(apiKey);
};

const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "noreply@compassabroad.com.tr";

export const emailRouter = createTRPCRouter({
  sendStudentInvitation: publicProcedure
    .input(
      z.object({
        studentName: z.string(),
        studentEmail: z.string().email(),
        invitationToken: z.string(),
        ambassadorName: z.string(),
        program: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Email] Sending student invitation to:", input.studentEmail);

      const client = getPostmarkClient();
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || "https://compassabroad.com.tr";
      const registrationLink = `${baseUrl}/student-registration/${input.invitationToken}`;

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compass Abroad'a Davet Edildiniz</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #D4AF37; font-size: 28px; font-weight: 700;">Compass Abroad</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px;">Yurt Dışı Eğitim Danışmanlığı</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 600;">Merhaba ${input.studentName},</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong>${input.ambassadorName}</strong> sizi <strong>${input.program}</strong> programı için Compass Abroad'a davet etti!
              </p>
              
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hesabınızı oluşturmak ve yurt dışı eğitim yolculuğunuza başlamak için aşağıdaki butona tıklayın.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${registrationLink}" style="display: inline-block; padding: 16px 40px; background-color: #D4AF37; color: #1a1a2e; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 12px;">
                      Hesabımı Oluştur
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:
              </p>
              <p style="margin: 8px 0 0; color: #D4AF37; font-size: 14px; word-break: break-all;">
                ${registrationLink}
              </p>
            </td>
          </tr>
          
          <!-- Info Box -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 12px; border-left: 4px solid #D4AF37;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #1a1a2e; font-size: 14px; font-weight: 600;">KVKK Bilgilendirmesi</p>
                    <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.5;">
                      Kayıt işlemi sırasında kişisel verilerinizin işlenmesine ilişkin yasal metinleri onaylamanız gerekmektedir.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                Bu e-posta Compass Abroad tarafından gönderilmiştir.
              </p>
              <p style="margin: 8px 0 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} Compass Abroad. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      const textBody = `
Merhaba ${input.studentName},

${input.ambassadorName} sizi ${input.program} programı için Compass Abroad'a davet etti!

Hesabınızı oluşturmak için aşağıdaki linke tıklayın:
${registrationLink}

KVKK Bilgilendirmesi:
Kayıt işlemi sırasında kişisel verilerinizin işlenmesine ilişkin yasal metinleri onaylamanız gerekmektedir.

Bu e-posta Compass Abroad tarafından gönderilmiştir.
© ${new Date().getFullYear()} Compass Abroad. Tüm hakları saklıdır.
      `.trim();

      try {
        const result = await client.sendEmail({
          From: FROM_EMAIL,
          To: input.studentEmail,
          Subject: "Compass Abroad'a Davet Edildiniz!",
          HtmlBody: htmlBody,
          TextBody: textBody,
          MessageStream: "outbound",
        });

        console.log("[Email] Invitation sent successfully:", result.MessageID);

        return {
          success: true,
          messageId: result.MessageID,
        };
      } catch (error) {
        console.error("[Email] Failed to send invitation:", error);
        throw new Error("E-posta gönderilemedi. Lütfen tekrar deneyin.");
      }
    }),

  sendAmbassadorInvitation: publicProcedure
    .input(
      z.object({
        inviteeName: z.string().optional(),
        inviteeEmail: z.string().email(),
        inviterName: z.string(),
        referralCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("[Email] Sending ambassador invitation to:", input.inviteeEmail);

      const client = getPostmarkClient();
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || "https://compassabroad.com.tr";
      const registrationLink = `${baseUrl}/ref/${input.referralCode}?type=ambassador`;

      const greeting = input.inviteeName ? `Merhaba ${input.inviteeName}` : "Merhaba";

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compass Abroad Elçi Programına Davet</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #D4AF37; font-size: 28px; font-weight: 700;">Compass Abroad</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px;">Elçi Programı</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 600;">${greeting},</h2>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong>${input.inviterName}</strong> sizi Compass Abroad Elçi Programı'na davet ediyor!
              </p>
              
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Elçi olarak öğrencileri yurt dışı eğitim programlarına yönlendirerek kazanç elde edebilirsiniz.
              </p>
              
              <!-- Benefits -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 8px;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 14px;">✓ Program başına 150$ - 2.500$ komisyon</p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 14px;">✓ Alt elçilerinizin kazançlarından %10 komisyon</p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 14px;">✓ Esnek çalışma imkanı</p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${registrationLink}" style="display: inline-block; padding: 16px 40px; background-color: #8B5CF6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 12px;">
                      Elçi Olarak Başvur
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Buton çalışmıyorsa, aşağıdaki linki tarayıcınıza kopyalayın:
              </p>
              <p style="margin: 8px 0 0; color: #8B5CF6; font-size: 14px; word-break: break-all;">
                ${registrationLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                Bu e-posta Compass Abroad tarafından gönderilmiştir.
              </p>
              <p style="margin: 8px 0 0; color: #888888; font-size: 12px;">
                © ${new Date().getFullYear()} Compass Abroad. Tüm hakları saklıdır.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();

      const textBody = `
${greeting},

${input.inviterName} sizi Compass Abroad Elçi Programı'na davet ediyor!

Elçi olarak öğrencileri yurt dışı eğitim programlarına yönlendirerek kazanç elde edebilirsiniz.

Avantajlar:
- Program başına 150$ - 2.500$ komisyon
- Alt elçilerinizin kazançlarından %10 komisyon
- Esnek çalışma imkanı

Başvurmak için: ${registrationLink}

Bu e-posta Compass Abroad tarafından gönderilmiştir.
© ${new Date().getFullYear()} Compass Abroad. Tüm hakları saklıdır.
      `.trim();

      try {
        const result = await client.sendEmail({
          From: FROM_EMAIL,
          To: input.inviteeEmail,
          Subject: "Compass Abroad Elçi Programına Davet!",
          HtmlBody: htmlBody,
          TextBody: textBody,
          MessageStream: "outbound",
        });

        console.log("[Email] Ambassador invitation sent successfully:", result.MessageID);

        return {
          success: true,
          messageId: result.MessageID,
        };
      } catch (error) {
        console.error("[Email] Failed to send ambassador invitation:", error);
        throw new Error("E-posta gönderilemedi. Lütfen tekrar deneyin.");
      }
    }),
});
