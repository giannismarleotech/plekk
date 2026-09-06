// Netlify scheduled function: roept elk uur /api/cron/reminders aan.
export default async () => {
  const base = process.env.PUBLIC_BASE_URL ?? process.env.URL;
  if (!base) return;
  await fetch(`${base}/api/cron/reminders`, { headers: process.env.CRON_SECRET ? { Authorization: `Bearer ${process.env.CRON_SECRET}` } : {} });
};
export const config = { schedule: "@hourly" };
