import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

const FROM_EMAIL = process.env.MAILJET_FROM_EMAIL || "noreply@compassabroad.com.tr";
const FROM_NAME = process.env.MAILJET_FROM_NAME || "Compass Abroad";

const sendEmail = async (params: {
  to: string;
  toName: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}) => {
  const apiKey = process.env.MAILJET_API_KEY;
  const apiSecret = process.env.MAILJET_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    console.error("[Email] MAILJET_API_KEY or MAILJET_SECRET_KEY not configured");
    throw new Error("MAILJET_API_KEY veya MAILJET_SECRET_KEY yapılandırılmamış");
  }

  const credentials = btoa(`${apiKey}:${apiSecret}`);

  const body = {
    Messages: [
      {
        From: {
          Email: FROM_EMAIL,
          Name: FROM_NAME,
        },
        To: [
          {
            Email: params.to,
            Name: params.toName,
          },
        ],
        Subject: params.subject,
        HTMLPart: params.htmlBody,
        TextPart: params.textBody,
      },
    ],
  };

  console.log("[Email] Sending email to:", params.to);

  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json() as {
    Messages?: Array<{
      Status?: string;
      Errors?: unknown[];
      To?: Array<{ MessageID?: number }>;
    }>;
  };

  const messageResult = result?.Messages?.[0];
  console.log("[Email] Mailjet response status:", messageResult?.Status);

  if (!response.ok || messageResult?.Status === "error") {
    console.error("[Email] Mailjet error:", JSON.stringify(messageResult?.Errors ?? result));
    throw new Error("E-posta gönderilemedi");
  }

  return messageResult?.To?.[0]?.MessageID?.toString() ?? "unknown";
};

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
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #D4AF37; font-size: 28px; font-weight: 700;">Compass Abroad</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px;">Yurt Disi Egitim Danismanligi</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 600;">Merhaba ${input.studentName},</h2>
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong>${input.ambassadorName}</strong> sizi <strong>${input.program}</strong> programi icin Compass Abroad'a davet etti!
              </p>
              <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hesabinizi olusturmak ve yurt disi egitim yolculugunuza baslamak icin asagidaki butona tiklayin.
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${registrationLink}" style="display: inline-block; padding: 16px 40px; background-color: #D4AF37; color: #1a1a2e; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 12px;">
                      Hesabimi Olustur
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Buton calismiyorsa, asagidaki linki tarayiciniza kopyalayin:
              </p>
              <p style="margin: 8px 0 0; color: #D4AF37; font-size: 14px; word-break: break-all;">
                ${registrationLink}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 40px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 12px; border-left: 4px solid #D4AF37;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #1a1a2e; font-size: 14px; font-weight: 600;">KVKK Bilgilendirmesi</p>
                    <p style="margin: 0; color: #666666; font-size: 13px; line-height: 1.5;">
                      Kayit islemi sirasinda kisisel verilerinizin islenmesine iliskin yasal metinleri onaylamaniz gerekmektedir.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                Bu e-posta Compass Abroad tarafindan gonderilmistir.
              </p>
              <p style="margin: 8px 0 0; color: #888888; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Compass Abroad. Tum haklari saklidir.
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

${input.ambassadorName} sizi ${input.program} programi icin Compass Abroad'a davet etti!

Hesabinizi olusturmak icin asagidaki linke tiklayin:
${registrationLink}

KVKK Bilgilendirmesi:
Kayit islemi sirasinda kisisel verilerinizin islenmesine iliskin yasal metinleri onaylamaniz gerekmektedir.

Bu e-posta Compass Abroad tarafindan gonderilmistir.
© ${new Date().getFullYear()} Compass Abroad. Tum haklari saklidir.
      `.trim();

      try {
        const messageId = await sendEmail({
          to: input.studentEmail,
          toName: input.studentName,
          subject: "Compass Abroad'a Davet Edildiniz!",
          htmlBody,
          textBody,
        });

        console.log("[Email] Student invitation sent successfully:", messageId);

        return {
          success: true,
          messageId,
        };
      } catch (error) {
        console.error("[Email] Failed to send student invitation:", error);
        throw new Error("E-posta gonderilemedi. Lutfen tekrar deneyin.");
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

      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || "https://compassabroad.com.tr";
      const registrationLink = `${baseUrl}/ref/${input.referralCode}?type=ambassador`;

      const greeting = input.inviteeName ? `Merhaba ${input.inviteeName}` : "Merhaba";

      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Compass Abroad Elci Programina Davet</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px 16px 0 0;">
              <h1 style="margin: 0; color: #D4AF37; font-size: 28px; font-weight: 700;">Compass Abroad</h1>
              <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px;">Elci Programi</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1a1a2e; font-size: 22px; font-weight: 600;">${greeting},</h2>
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong>${input.inviterName}</strong> sizi Compass Abroad Elci Programi'na davet ediyor!
              </p>
              <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Elci olarak ogrencileri yurt disi egitim programlarina yonlendirerek kazanc elde edebilirsiniz.
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 8px;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 14px;">&#10003; Program basina 150$ - 2.500$ komisyon</p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 14px;">&#10003; Alt elcilerinizin kazanclarindan %10 komisyon</p>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f8f9fa; border-radius: 8px;">
                    <p style="margin: 0; color: #1a1a2e; font-size: 14px;">&#10003; Esnek calisma imkani</p>
                  </td>
                </tr>
              </table>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${registrationLink}" style="display: inline-block; padding: 16px 40px; background-color: #8B5CF6; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 12px;">
                      Elci Olarak Basvur
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
                Buton calismiyorsa, asagidaki linki tarayiciniza kopyalayin:
              </p>
              <p style="margin: 8px 0 0; color: #8B5CF6; font-size: 14px; word-break: break-all;">
                ${registrationLink}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; color: #888888; font-size: 12px;">
                Bu e-posta Compass Abroad tarafindan gonderilmistir.
              </p>
              <p style="margin: 8px 0 0; color: #888888; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Compass Abroad. Tum haklari saklidir.
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

${input.inviterName} sizi Compass Abroad Elci Programi'na davet ediyor!

Elci olarak ogrencileri yurt disi egitim programlarina yonlendirerek kazanc elde edebilirsiniz.

Avantajlar:
- Program basina 150$ - 2.500$ komisyon
- Alt elcilerinizin kazanclarindan %10 komisyon
- Esnek calisma imkani

Basvurmak icin: ${registrationLink}

Bu e-posta Compass Abroad tarafindan gonderilmistir.
© ${new Date().getFullYear()} Compass Abroad. Tum haklari saklidir.
      `.trim();

      try {
        const messageId = await sendEmail({
          to: input.inviteeEmail,
          toName: input.inviteeName || "Elci Adayi",
          subject: "Compass Abroad Elci Programina Davet!",
          htmlBody,
          textBody,
        });

        console.log("[Email] Ambassador invitation sent successfully:", messageId);

        return {
          success: true,
          messageId,
        };
      } catch (error) {
        console.error("[Email] Failed to send ambassador invitation:", error);
        throw new Error("E-posta gonderilemedi. Lutfen tekrar deneyin.");
      }
    }),
});
