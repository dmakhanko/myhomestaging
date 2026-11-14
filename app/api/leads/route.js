import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

async function sendLeadEmail(lead, db) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[leads] email skipped: RESEND_API_KEY not set");
    return;
  }

  const doc = await db.collection("site_content").findOne({ _id: "default" });
  const notifyEmail = doc?.content?.settings?.notifyEmail;
  if (!notifyEmail) {
    console.warn("[leads] email skipped: notifyEmail not set in admin settings");
    return;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #D6AF6F;">Новая заявка с сайта</h2>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 120px;">Имя:</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #333;">${lead.name || "—"}</td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Телефон:</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #333;"><a href="tel:${lead.phone}" style="color: #D6AF6F;">${lead.phone}</a></td></tr>
          <tr><td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #555; vertical-align: top;">Сообщение:</td><td style="padding: 12px 0; border-bottom: 1px solid #eee; color: #333;">${lead.message || "—"}</td></tr>
          <tr><td style="padding: 12px 0; font-weight: bold; color: #555;">Дата:</td><td style="padding: 12px 0; color: #333;">${lead.created_at}</td></tr>
        </table>
      </div>
      <p style="margin-top: 20px; font-size: 12px; color: #999;">Отправлено автоматически с сайта Квартирный стилист</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.SENDER_EMAIL || "onboarding@resend.dev",
      to: [notifyEmail],
      subject: `🏠 Новая заявка: ${lead.name || "Без имени"} — ${lead.phone}`,
      html,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) console.error("[leads] email failed:", res.status, await res.text().catch(() => ""));
}


// SMS о новой заявке через SMS.ru. Номера — в SMS_NOTIFY_TO через запятую.
async function sendLeadSms(lead) {
  const apiId = process.env.SMS_RU_API_ID;
  const to = (process.env.SMS_NOTIFY_TO || "").replace(/[^0-9,]/g, "");
  if (!apiId || !to) {
    console.warn("[leads] SMS skipped: SMS_RU_API_ID or SMS_NOTIFY_TO not set");
    return;
  }
  const text = `Заявка с сайта: ${lead.name || "без имени"}, ${lead.phone}. ${lead.message || ""}`
    .replace(/\s+/g, " ")
    .trim();
  const msg = text.length > 130 ? text.slice(0, 127) + "..." : text;

  const params = new URLSearchParams({ api_id: apiId, to, msg, json: "1" });
  if (process.env.SMS_FROM) params.set("from", process.env.SMS_FROM);

  const res = await fetch("https://sms.ru/sms/send", {
    method: "POST",
    body: params,
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json().catch(() => null);
  const failed = !data || data.status !== "OK" ||
    Object.values(data.sms || {}).some((r) => r.status !== "OK");
  if (failed) console.error("[leads] SMS failed:", JSON.stringify(data));
}

export async function POST(request) {
  const { name = "", phone, message = "", website = "" } = await request.json();
  if (!phone || phone.length < 7) {
    return Response.json({ detail: "Invalid phone" }, { status: 422 });
  }

  const db = await getDb();
  const lead = {
    id: `lead_${Date.now()}`,
    name: name.trim(),
    phone: phone.trim(),
    message: message.trim(),
    created_at: new Date().toISOString(),
  };

  // Ловушка для ботов: поле website скрыто от людей. Заполнено — сохраняем как спам, без уведомлений.
  if (website) {
    await db.collection("leads").insertOne({ ...lead, spam: true });
    return Response.json(lead);
  }

  await db.collection("leads").insertOne(lead);

  // Ждём отправки: на Vercel функция останавливается после ответа, «выстрелил и забыл» теряет уведомления.
  const results = await Promise.allSettled([sendLeadSms(lead), sendLeadEmail(lead, db)]);
  results.forEach((r) => {
    if (r.status === "rejected") console.error("[leads] notify error:", r.reason?.message || r.reason);
  });

  return Response.json(lead);
}

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const db = await getDb();
  const leads = await db
    .collection("leads")
    .find({ spam: { $ne: true } }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  return Response.json({ leads });
}
