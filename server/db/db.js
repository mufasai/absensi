import { Pool } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
let pool = null;

// Cek apakah DATABASE_URL sudah diisi dengan connection string Neon yang sah
const isConfigured =
  connectionString &&
  !connectionString.includes("ep-cool-darkness-123456") &&
  connectionString.startsWith("postgres");

if (isConfigured) {
  try {
    pool = new Pool({ connectionString });
    pool.on("error", (err) => {
      console.warn("⚠️ Neon Database Pool Event Error:", err.message);
    });
  } catch (e) {
    console.warn("⚠️ Pool initialization warning:", e.message);
  }
} else {
  console.warn(
    "⚠️ DATABASE_URL masih menggunakan placeholder di .env. Mengaktifkan mode memori lokal sampai connection string Neon asli diatur."
  );
}

export async function query(text, params) {
  if (!pool) {
    throw new Error("DATABASE_URL belum diatur dengan connection string Neon yang valid di file .env");
  }

  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log("Executed DB Query", { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    console.error("Database query error:", err.message);
    throw err;
  }
}
