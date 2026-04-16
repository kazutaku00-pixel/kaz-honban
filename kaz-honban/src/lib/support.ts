// Support email is configurable via NEXT_PUBLIC_SUPPORT_EMAIL. Falls back to a
// safe default so error screens and footers always have somewhere to send the user.

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@nihongo.app";

export function supportMailto(subject = "NihonGo Support"): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
