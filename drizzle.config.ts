import { defineConfig } from "drizzle-kit";

// Parse DATABASE_URL or use explicit config
function getDbConfig() {
  // Use explicit config to avoid URL parsing issues
  return {
    host: process.env.DB_HOST || '192.168.29.12',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'remote_user',
    password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
    database: process.env.DB_NAME || 'lead_lims2',
  };
}

const config = getDbConfig();

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: config,
});
