import pg from "pg";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ref = process.env.SUPABASE_PROJECT_REF || "rovbqnncmzltdyeeldxz";
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Set SUPABASE_DB_PASSWORD");
  process.exit(1);
}

const client = new pg.Client({
  host: "aws-0-us-west-2.pooler.supabase.com",
  port: 5432,
  user: `postgres.${ref}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const migrationsDir = join(__dirname, "../sql/migrations");
const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

try {
  await client.connect();
  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    await client.query(sql);
    console.log(`Ran ${file}`);
  }
  console.log("Migrations completed successfully");
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
