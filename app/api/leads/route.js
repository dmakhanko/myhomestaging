import { getDb } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

async function sendLeadEmail(lead, db) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const doc = await db.collection("site_content").findOne({ _id: "default" });
  const notifyEmail = doc?.content?.settings?.notifyEmail;
  if (!notifyEmail) return;

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

  await fetch("https://api.resend.com/emails", {
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
  }).catch(() => {});
}

export async function POST(request) {
  const { name = "", phone, message = "" } = await request.json();
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

  await db.collection("leads").insertOne(lead);
  sendLeadEmail(lead, db); // fire and forget

  return Response.json(lead);
}

export async function GET(request) {
  const authError = requireAuth(request);
  if (authError) return authError;

  const db = await getDb();
  const leads = await db
    .collection("leads")
    .find({}, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .toArray();

  return Response.json({ leads });
}
