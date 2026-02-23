import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ref = process.env.SUPABASE_PROJECT_REF || "rovbqnncmzltdyeeldxz";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD");
  process.exit(1);
}

// Try pooler first (more reliable for remote connections)
const client = new pg.Client({
  host: "aws-0-us-west-2.pooler.supabase.com",
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const sql = readFileSync(join(__dirname, "../sql/migrations/001_initial.sql"), "utf8");

try {
  await client.connect();
  await client.query(sql);
  console.log("Migration completed successfully");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
