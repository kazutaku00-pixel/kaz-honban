// Lightweight Resend integration. No SDK — single fetch.
// Silently skips when RESEND_API_KEY is unset (dev-friendly).

// Display names come from user-controlled profile fields. Escape before
// inlining into HTML bodies so a malicious name can't inject markup.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Subjects go into an email header, so newlines would let a malicious display
// name inject additional headers (CC, BCC…). Strip CR/LF and clamp length.
function sanitizeSubject(s: string): string {
  return s.replace(/[\r\n\t]/g, " ").trim().slice(0, 255);
}

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
};

async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "NihonGo <noreply@nihongo.app>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", to);
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[email] Resend API error:", res.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Resend fetch failed:", err);
    return false;
  }
}

function formatLessonTime(iso: string, timezone?: string | null): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone ?? undefined,
      timeZoneName: "short",
    });
  } catch {
    return new Date(iso).toISOString();
  }
}

function baseLayout(body: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta =
    ctaLabel && ctaUrl
      ? `<p style="margin:24px 0"><a href="${ctaUrl}" style="background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block;font-weight:600">${ctaLabel}</a></p>`
      : "";
  return `<!doctype html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;padding:24px;color:#111827">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e7eb">
      <h1 style="font-size:20px;margin:0 0 16px">NihonGo</h1>
      ${body}
      ${cta}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
      <p style="color:#6b7280;font-size:13px;margin:0">If you didn't expect this email, you can ignore it.</p>
    </div>
  </body></html>`;
}

export async function sendBookingConfirmation(params: {
  toEmail: string;
  toName: string;
  counterpartName: string;
  scheduledStartAt: string;
  durationMinutes: number;
  bookingId: string;
  timezone?: string | null;
  role: "learner" | "teacher";
}): Promise<boolean> {
  const { toEmail, toName, counterpartName, scheduledStartAt, durationMinutes, bookingId, timezone, role } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const when = formatLessonTime(scheduledStartAt, timezone);
  const link = role === "teacher" ? `${appUrl}/teacher/bookings` : `${appUrl}/bookings`;

  const toNameSafe = esc(toName);
  const counterpartSafe = esc(counterpartName);

  const intro =
    role === "teacher"
      ? `<p>Hi ${toNameSafe},</p><p>You have a new lesson booking with <strong>${counterpartSafe}</strong>.</p>`
      : `<p>Hi ${toNameSafe},</p><p>Your lesson with <strong>${counterpartSafe}</strong> is confirmed.</p>`;

  const body = `${intro}
    <ul style="line-height:1.8">
      <li><strong>When:</strong> ${esc(when)}</li>
      <li><strong>Duration:</strong> ${durationMinutes} minutes</li>
    </ul>
    <p>We'll email you again a few hours before the lesson with the join link.</p>`;

  return sendEmail({
    to: toEmail,
    subject: sanitizeSubject(
      role === "teacher"
        ? `New booking with ${counterpartName}`
        : `Lesson confirmed with ${counterpartName}`
    ),
    html: baseLayout(body, "View booking", link),
  });
}

export async function sendLessonReminder(params: {
  toEmail: string;
  toName: string;
  counterpartName: string;
  scheduledStartAt: string;
  bookingId: string;
  timezone?: string | null;
  role: "learner" | "teacher";
}): Promise<boolean> {
  const { toEmail, toName, counterpartName, scheduledStartAt, bookingId, timezone, role } = params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const when = formatLessonTime(scheduledStartAt, timezone);
  const link = `${appUrl}/room/${bookingId}`;

  const body = `<p>Hi ${esc(toName)},</p>
    <p>Reminder: you have a lesson with <strong>${esc(counterpartName)}</strong> at <strong>${esc(when)}</strong>.</p>
    <p>Please arrive a few minutes early to check your camera and microphone.</p>`;

  return sendEmail({
    to: toEmail,
    subject: sanitizeSubject(`Lesson with ${counterpartName} at ${when}`),
    html: baseLayout(body, "Join lesson room", link),
  });
}

export async function sendTeacherInvite(params: {
  toEmail: string;
  inviteCode: string;
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/signup?role=teacher&invite=${params.inviteCode}`;
  const body = `<p>You've been invited to teach on NihonGo.</p>
    <p>Click the button below to create your teacher profile. This invite expires in 30 days.</p>
    <p style="color:#6b7280;font-size:13px">Invite code: <code>${esc(params.inviteCode)}</code></p>`;
  return sendEmail({
    to: params.toEmail,
    subject: sanitizeSubject("You're invited to teach on NihonGo"),
    html: baseLayout(body, "Accept invitation", link),
  });
}
