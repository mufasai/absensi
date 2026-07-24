import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "./db/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// UUID Helper Validator
const isUUID = (str) =>
  typeof str === "string" &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

// Timezone Helper: Ensure UTC ISO string with 'Z' is converted to WIB (Asia/Jakarta, UTC+7)
function formatTimeWIB(dateStr) {
  if (!dateStr) return "—";
  try {
    let str = dateStr instanceof Date ? dateStr.toISOString() : String(dateStr);
    if (str.includes(" ")) {
      str = str.replace(" ", "T");
    }
    if (!str.endsWith("Z") && !str.includes("+")) {
      str += "Z";
    }
    return new Date(str)
      .toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(".", ":");
  } catch (e) {
    return "—";
  }
}

function formatDateWIB(dateStr) {
  if (!dateStr) return "—";
  try {
    let str = dateStr instanceof Date ? dateStr.toISOString() : String(dateStr);
    if (str.includes(" ")) {
      str = str.replace(" ", "T");
    }
    if (!str.endsWith("Z") && !str.includes("+")) {
      str += "Z";
    }
    return new Date(str).toLocaleDateString("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return "—";
  }
}

// In-Memory Fallback Stores
const LOCAL_USERS_STORE = [];
const LOCAL_ABSENSI_STORE = [];

// Auto Init Database Tables & Default Seed Data
async function initDatabase() {
  try {
    const schemaPath = path.join(__dirname, "db", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, "utf8");
      await query(sql);
      console.log("⚡ Skema Database PostgreSQL Neon Berhasil Dibuat/Diverifikasi.");
    }

    const adminEmail = "admin@sasta.com";
    const result = await query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("sastastudio20", salt);

    if (result.rows.length === 0) {
      await query(
        `INSERT INTO users (name, email, password_hash, role, initials, employee_code)
         VALUES ($1, $2, $3, 'admin', 'AS', 'ADM-0001')`,
        ["Admin Sasta", adminEmail, hash]
      );
      console.log("✅ Akun Admin Sasta (admin@sasta.com) Berhasil Disimpan di Database.");
    } else {
      await query("UPDATE users SET name = 'Admin Sasta', password_hash = $1, role = 'admin' WHERE email = $2", [hash, adminEmail]);
      console.log("✅ Kredensial Admin Sasta Berhasil Dikonfirmasi di Database.");
    }
  } catch (err) {
    console.warn("⚠️ Catatan DB Neon:", err.message);
  }
}

initDatabase().catch((e) => console.warn("Init DB skipped:", e.message));

// API Healthcheck
app.get("/api/health", async (req, res) => {
  res.json({ status: "OK", server: "Express Absensi API", port: PORT });
});

// 1. API Auth Login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email dan kata sandi wajib diisi." });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const result = await query("SELECT * FROM users WHERE email = $1", [cleanEmail]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      let isMatch = false;

      if (user.password_hash && (user.password_hash.startsWith("$2a$") || user.password_hash.startsWith("$2b$"))) {
        isMatch = await bcrypt.compare(password, user.password_hash);
      } else {
        isMatch = (password === user.password_hash);
      }

      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Kata sandi yang Anda masukkan salah." });
      }

      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          initials: user.initials || user.name.substring(0, 2).toUpperCase(),
        },
      });
    }
  } catch (err) {
    console.warn("Koneksi DB Neon Login query:", err.message);
  }

  const localUser = LOCAL_USERS_STORE.find((u) => u.email === cleanEmail);
  if (!localUser) {
    return res.status(401).json({ success: false, message: "Email tidak terdaftar di sistem." });
  }

  let isMatch = false;
  if (localUser.password_hash.startsWith("$2a$") || localUser.password_hash.startsWith("$2b$")) {
    isMatch = await bcrypt.compare(password, localUser.password_hash);
  } else {
    isMatch = (password === localUser.password_hash);
  }

  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Kata sandi yang Anda masukkan salah." });
  }

  return res.json({
    success: true,
    user: {
      id: localUser.id,
      name: localUser.name,
      email: localUser.email,
      role: localUser.role,
      initials: localUser.initials,
    },
  });
});

// 2. API Auth Register
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "Semua kolom data wajib diisi." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  try {
    const existing = await query("SELECT id FROM users WHERE email = $1", [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email ini sudah terdaftar di sistem." });
    }

    const empCode = "EMP-" + Math.floor(1000 + Math.random() * 9000);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, initials, employee_code)
       VALUES ($1, $2, $3, 'employee', $4, $5)
       RETURNING id, name, email, role, initials, employee_code`,
      [name.trim(), cleanEmail, hash, initials, empCode]
    );

    const newUser = result.rows[0];
    return res.json({ success: true, user: newUser });
  } catch (err) {
    console.warn("DB Register fallback to memory:", err.message);

    const localExisting = LOCAL_USERS_STORE.find((u) => u.email === cleanEmail);
    if (localExisting) {
      return res.status(400).json({ success: false, message: "Email ini sudah terdaftar di sistem." });
    }

    const newLocalUser = {
      id: "mem-" + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password_hash: hash,
      role: "employee",
      initials: initials,
    };

    LOCAL_USERS_STORE.push(newLocalUser);
    console.log(`✅ Registered new user in memory: ${cleanEmail}`);

    return res.json({ success: true, user: newLocalUser });
  }
});

// 3. API Admin Dashboard Real Data (Belum Hadir default for un-absented users)
app.get("/api/admin/dashboard", async (req, res) => {
  let dbUsers = [];
  let dbAbsensi = [];

  try {
    const usersResult = await query("SELECT id, name, email, role, initials FROM users ORDER BY name ASC");
    dbUsers = usersResult.rows;

    const todayAbsensiResult = await query(
      `SELECT * FROM absensi WHERE date = CURRENT_DATE ORDER BY created_at DESC`
    );
    dbAbsensi = todayAbsensiResult.rows;
  } catch (err) {
    console.warn("Neon DB query dashboard:", err.message);
  }

  const hadirCount = dbAbsensi.filter((a) => a.status === "hadir").length;
  const telatCount = dbAbsensi.filter((a) => a.status === "telat").length;
  const izinCount = dbAbsensi.filter((a) => a.status === "izin").length;

  const teamList = dbUsers
    .filter((u) => u.role !== "admin")
    .map((user) => {
      const absensi = dbAbsensi.find(
        (a) => a.user_id === user.id || a.user_name === user.name
      );
      if (absensi) {
        return {
          id: user.id,
          name: user.name,
          in: formatTimeWIB(absensi.check_in),
          out: formatTimeWIB(absensi.check_out),
          status: absensi.status,
          location: absensi.location,
          keterangan: absensi.keterangan,
        };
      } else {
        return {
          id: user.id,
          name: user.name,
          in: "—",
          out: "—",
          status: "belum_absen",
          location: null,
          keterangan: "Belum Hadir",
        };
      }
    });

  return res.json({
    success: true,
    stats: {
      hadir: hadirCount,
      telat: telatCount,
      izin: izinCount,
      totalKaryawan: teamList.length,
    },
    team: teamList,
  });
});

// 4. API Employee Attendance History
app.get("/api/absensi/history", async (req, res) => {
  const { userId, userName } = req.query;
  let historyRecords = [];

  try {
    let result;
    if (userId && isUUID(userId)) {
      result = await query(
        `SELECT * FROM absensi WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 30`,
        [userId]
      );
    } else if (userName) {
      result = await query(
        `SELECT * FROM absensi WHERE user_name = $1 ORDER BY date DESC, created_at DESC LIMIT 30`,
        [userName]
      );
    } else {
      result = await query(`SELECT * FROM absensi ORDER BY date DESC, created_at DESC LIMIT 30`);
    }

    if (result && result.rows) {
      historyRecords = result.rows;
    }
  } catch (err) {
    console.warn("DB History error:", err.message);
    historyRecords = LOCAL_ABSENSI_STORE.filter((h) => {
      if (!userId && !userName) return true;
      return h.user_id === userId || h.user_name === userName;
    });
  }

  const formattedHistory = historyRecords.map((row) => ({
    id: row.id,
    date: formatDateWIB(row.date || row.created_at),
    in: formatTimeWIB(row.check_in),
    out: formatTimeWIB(row.check_out),
    status: row.status,
    duration: row.duration || "—",
    location: row.location,
    keterangan: row.keterangan,
  }));

  return res.json({ success: true, history: formattedHistory });
});

// 5. API Check-In
app.post("/api/absensi/checkin", async (req, res) => {
  const { userId, userName, status, location, latitude, longitude } = req.body;
  const validUserId = isUUID(userId) ? userId : null;
  const nowISO = new Date().toISOString();

  try {
    const result = await query(
      `INSERT INTO absensi (user_id, user_name, date, check_in, status, location, latitude, longitude, is_active)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, TRUE)
       RETURNING *`,
      [validUserId, userName, nowISO, status || "hadir", location, latitude || null, longitude || null]
    );

    const record = result.rows[0];
    console.log("✅ Check-in Berhasil Disimpan ke Neon DB:", record.id);
    return res.json({ success: true, absensi: record });
  } catch (err) {
    console.warn("📌 Simpan DB Error:", err.message);

    const localRecord = {
      id: "abs-" + Date.now(),
      user_id: userId,
      user_name: userName,
      date: new Date().toISOString().split("T")[0],
      check_in: nowISO,
      status: status || "hadir",
      location: location,
      is_active: true,
    };

    LOCAL_ABSENSI_STORE.unshift(localRecord);
    return res.json({ success: true, absensi: localRecord });
  }
});

// 6. API Check-Out
app.post("/api/absensi/checkout", async (req, res) => {
  const { absensiId, userId, duration } = req.body;
  const validAbsensiId = isUUID(absensiId) ? absensiId : null;
  const nowISO = new Date().toISOString();

  try {
    let result;
    if (validAbsensiId) {
      result = await query(
        `UPDATE absensi SET check_out = $3, duration = $2, is_active = FALSE WHERE id = $1 RETURNING *`,
        [validAbsensiId, duration, nowISO]
      );
    } else if (userId && isUUID(userId)) {
      result = await query(
        `UPDATE absensi SET check_out = $3, duration = $2, is_active = FALSE WHERE user_id = $1 AND is_active = TRUE RETURNING *`,
        [userId, duration, nowISO]
      );
    }

    if (result && result.rows.length > 0) {
      const record = result.rows[0];
      console.log("✅ Check-out Berhasil Disimpan ke Neon DB:", record.id);
      return res.json({ success: true, absensi: record });
    }
  } catch (err) {
    console.warn("📌 Check-out DB Error:", err.message);
  }

  const localItem = LOCAL_ABSENSI_STORE.find(
    (a) => (a.id === absensiId || a.user_name === userId || a.user_id === userId) && a.is_active
  );

  if (localItem) {
    localItem.check_out = nowISO;
    localItem.duration = duration;
    localItem.is_active = false;
  }

  return res.json({ success: true, absensi: localItem || null });
});

// 7. API Submit Leave / Izin
app.post("/api/absensi/izin", async (req, res) => {
  const { userId, userName, type, note } = req.body;
  const validUserId = isUUID(userId) ? userId : null;
  const ket = note ? `${type} — ${note}` : type;

  try {
    const result = await query(
      `INSERT INTO absensi (user_id, user_name, date, status, keterangan, is_active)
       VALUES ($1, $2, CURRENT_DATE, 'izin', $3, FALSE)
       RETURNING *`,
      [validUserId, userName, ket]
    );

    const record = result.rows[0];
    console.log("✅ Pengajuan Izin Berhasil Disimpan ke Neon DB:", record.id);
    return res.json({ success: true, absensi: record });
  } catch (err) {
    console.warn("📌 Izin DB Error:", err.message);

    const localRecord = {
      id: "izin-" + Date.now(),
      user_id: userId,
      user_name: userName,
      date: new Date().toISOString().split("T")[0],
      status: "izin",
      keterangan: ket,
      is_active: false,
    };

    LOCAL_ABSENSI_STORE.unshift(localRecord);
    return res.json({ success: true, absensi: localRecord });
  }
});

// 8. API Work Settings
app.get("/api/settings", async (req, res) => {
  try {
    const result = await query("SELECT * FROM work_settings WHERE id = 1");
    if (result.rows.length === 0) {
      return res.json({ jamMasuk: "09:00", toleransi: 15, jamPulang: "17:30" });
    }
    const row = result.rows[0];
    res.json({
      jamMasuk: row.jam_masuk ? row.jam_masuk.substring(0, 5) : "09:00",
      toleransi: row.toleransi || 15,
      jamPulang: row.jam_pulang ? row.jam_pulang.substring(0, 5) : "17:30",
    });
  } catch (err) {
    res.json({ jamMasuk: "09:00", toleransi: 15, jamPulang: "17:30" });
  }
});

app.put("/api/settings", async (req, res) => {
  const { jamMasuk, toleransi, jamPulang } = req.body;
  try {
    const result = await query(
      `INSERT INTO work_settings (id, jam_masuk, toleransi, jam_pulang, updated_at)
       VALUES (1, $1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE 
       SET jam_masuk = $1, toleransi = $2, jam_pulang = $3, updated_at = NOW()
       RETURNING *`,
      [jamMasuk, toleransi, jamPulang]
    );
    const row = result.rows[0];
    res.json({
      jamMasuk: row.jam_masuk ? row.jam_masuk.substring(0, 5) : "09:00",
      toleransi: row.toleransi || 15,
      jamPulang: row.jam_pulang ? row.jam_pulang.substring(0, 5) : "17:30",
    });
  } catch (err) {
    res.json({ jamMasuk: jamMasuk || "09:00", toleransi: toleransi || 15, jamPulang: jamPulang || "17:30" });
  }
});

// Export Express App for Vercel Serverless Functions
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Express Server Absensi App berjalan di http://localhost:${PORT}`);
  });
}

export default app;
