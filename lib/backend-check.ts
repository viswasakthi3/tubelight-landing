export function backendConfigured(): boolean {
  return !!(
    process.env.PANEL_ADMIN_TOKEN ||
    process.env.ADMIN_API_TOKEN ||
    (process.env.PANEL_ADMIN_USERNAME && process.env.PANEL_ADMIN_PASSWORD) ||
    (process.env.DEV_ADMIN_USERNAME && process.env.DEV_ADMIN_PASSWORD) ||
    process.env.DATABASE_URL
  );
}
