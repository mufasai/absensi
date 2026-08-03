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
// Increased body limit to 10MB to support profile avatar photo upload via Base64
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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

    // Auto upgrade status & avatar_url column
    await query("ALTER TABLE absensi ALTER COLUMN status TYPE VARCHAR(100);");
    await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;");
    await query("ALTER TABLE absensi ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;");
    await query("ALTER TABLE absensi ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;");
    await query("ALTER TABLE absensi ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved';");
    await query("ALTER TABLE absensi ADD COLUMN IF NOT EXISTS decline_reason TEXT;");

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
          avatar_url: user.avatar_url || null,
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
      avatar_url: localUser.avatar_url || null,
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
       RETURNING id, name, email, role, initials, employee_code, avatar_url`,
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
      avatar_url: null,
    };

    LOCAL_USERS_STORE.push(newLocalUser);
    console.log(`✅ Registered new user in memory: ${cleanEmail}`);

    return res.json({ success: true, user: newLocalUser });
  }
});

// 3. API Edit User Profile (Name, Email, Avatar Photo)
app.put("/api/users/profile", async (req, res) => {
  const { userId, name, email, avatarUrl } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "ID Pengguna wajib dikirim." });
  }
  if (!name || !email) {
    return res.status(400).json({ success: false, message: "Nama dan Email wajib diisi." });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanName = name.trim();
  const initials = cleanName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  try {
    if (isUUID(userId)) {
      // Check duplicate email
      const checkEmail = await query("SELECT id FROM users WHERE email = $1 AND id != $2", [cleanEmail, userId]);
      if (checkEmail.rows.length > 0) {
        return res.status(400).json({ success: false, message: "Email ini sudah digunakan oleh pengguna lain." });
      }

      const result = await query(
        `UPDATE users 
         SET name = $1, email = $2, avatar_url = $3, initials = $4 
         WHERE id = $5 
         RETURNING id, name, email, role, initials, avatar_url, employee_code`,
        [cleanName, cleanEmail, avatarUrl || null, initials, userId]
      );

      if (result.rows.length > 0) {
        const updatedUser = result.rows[0];
        // Also sync name in absensi history
        await query("UPDATE absensi SET user_name = $1 WHERE user_id = $2", [cleanName, userId]);
        console.log("✅ Profil pengguna berhasil diperbarui di Neon DB:", updatedUser.name);
        return res.json({ success: true, user: updatedUser });
      }
    }
  } catch (err) {
    console.warn("📌 Error Update Profil DB:", err.message);
  }

  // Fallback memory store update
  const localUser = LOCAL_USERS_STORE.find((u) => u.id === userId || u.email === cleanEmail);
  if (localUser) {
    localUser.name = cleanName;
    localUser.email = cleanEmail;
    localUser.avatar_url = avatarUrl || null;
    localUser.initials = initials;
    return res.json({ success: true, user: localUser });
  }

  const fallbackUser = {
    id: userId,
    name: cleanName,
    email: cleanEmail,
    avatar_url: avatarUrl || null,
    initials,
  };
  return res.json({ success: true, user: fallbackUser });
});

// 4. API Admin Dashboard Real Data
app.get("/api/admin/dashboard", async (req, res) => {
  let dbUsers = [];
  let dbAbsensi = [];

  try {
    const usersResult = await query("SELECT id, name, email, role, initials, avatar_url FROM users ORDER BY name ASC");
    dbUsers = usersResult.rows;

    const todayAbsensiResult = await query(
      `SELECT * FROM absensi 
       WHERE date = CURRENT_DATE 
          OR (start_date::date <= CURRENT_DATE AND end_date::date >= CURRENT_DATE AND approval_status = 'approved')
       ORDER BY created_at DESC`
    );
    dbAbsensi = todayAbsensiResult.rows;
  } catch (err) {
    console.warn("Neon DB query dashboard:", err.message);
  }

  const hadirCount = dbAbsensi.filter((a) => a.status === "Present" || a.status === "hadir").length;
  const telatCount = dbAbsensi.filter((a) => a.status === "Late" || a.status === "telat").length;
  const izinCount = dbAbsensi.filter((a) => a.status !== "Present" && a.status !== "hadir" && a.status !== "Late" && a.status !== "telat" && a.status !== "belum_absen").length;

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
          approval_status: absensi.approval_status || "approved",
          decline_reason: absensi.decline_reason,
          avatar_url: user.avatar_url,
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
          approval_status: "approved",
          avatar_url: user.avatar_url,
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

// 5. API Employee Attendance History
app.get("/api/absensi/history", async (req, res) => {
  const { userId, userName } = req.query;
  let historyRecords = [];

  try {
    let result;
    if (userId && isUUID(userId)) {
      result = await query(
        `SELECT * FROM absensi WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 60`,
        [userId]
      );
    } else if (userName) {
      result = await query(
        `SELECT * FROM absensi WHERE user_name = $1 ORDER BY date DESC, created_at DESC LIMIT 60`,
        [userName]
      );
    } else {
      result = await query(`SELECT * FROM absensi ORDER BY date DESC, created_at DESC LIMIT 60`);
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
    date: formatDateWIB(row.date || row.start_date || row.created_at),
    in: formatTimeWIB(row.check_in),
    out: formatTimeWIB(row.check_out),
    status: row.status,
    duration: row.duration || "—",
    location: row.location,
    keterangan: row.keterangan,
    approval_status: row.approval_status || "approved",
    decline_reason: row.decline_reason,
    start_date: row.start_date,
    end_date: row.end_date,
  }));

  return res.json({ success: true, history: formattedHistory });
});

// 6. API Check-In Guard & Status
app.get("/api/absensi/today-leave", async (req, res) => {
  const { userId, userName } = req.query;
  try {
    let result;
    if (userId && isUUID(userId)) {
      result = await query(
        `SELECT * FROM absensi 
         WHERE user_id = $1 
           AND status NOT IN ('Present', 'Late', 'hadir', 'telat', 'belum_absen')
           AND approval_status IN ('pending', 'approved')
           AND (
             date = CURRENT_DATE 
             OR (start_date::date <= CURRENT_DATE AND end_date::date >= CURRENT_DATE)
           )
         LIMIT 1`,
        [userId]
      );
    } else if (userName) {
      result = await query(
        `SELECT * FROM absensi 
         WHERE user_name = $1 
           AND status NOT IN ('Present', 'Late', 'hadir', 'telat', 'belum_absen')
           AND approval_status IN ('pending', 'approved')
           AND (
             date = CURRENT_DATE 
             OR (start_date::date <= CURRENT_DATE AND end_date::date >= CURRENT_DATE)
           )
         LIMIT 1`,
        [userName]
      );
    }

    if (result && result.rows.length > 0) {
      return res.json({ hasLeaveToday: true, leave: result.rows[0] });
    }
  } catch (err) {
    console.warn("DB today-leave query:", err.message);
  }
  return res.json({ hasLeaveToday: false });
});

// 7. API Check-In
app.post("/api/absensi/checkin", async (req, res) => {
  const { userId, userName, status, location, latitude, longitude } = req.body;
  const validUserId = isUUID(userId) ? userId : null;
  const nowISO = new Date().toISOString();

  // Guard: Check if user has an active leave for today
  try {
    let leaveCheck;
    if (validUserId) {
      leaveCheck = await query(
        `SELECT * FROM absensi 
         WHERE user_id = $1 
           AND status NOT IN ('Present', 'Late', 'hadir', 'telat', 'belum_absen')
           AND approval_status IN ('pending', 'approved')
           AND (
             date = CURRENT_DATE 
             OR (start_date::date <= CURRENT_DATE AND end_date::date >= CURRENT_DATE)
           )
         LIMIT 1`,
        [validUserId]
      );
    } else if (userName) {
      leaveCheck = await query(
        `SELECT * FROM absensi 
         WHERE user_name = $1 
           AND status NOT IN ('Present', 'Late', 'hadir', 'telat', 'belum_absen')
           AND approval_status IN ('pending', 'approved')
           AND (
             date = CURRENT_DATE 
             OR (start_date::date <= CURRENT_DATE AND end_date::date >= CURRENT_DATE)
           )
         LIMIT 1`,
        [userName]
      );
    }

    if (leaveCheck && leaveCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Anda hari ini mengajukan izin, tidak bisa melakukan checkin.",
        leave: leaveCheck.rows[0],
      });
    }
  } catch (e) {
    console.warn("Checkin leave guard check:", e.message);
  }

  try {
    const result = await query(
      `INSERT INTO absensi (user_id, user_name, date, check_in, status, location, latitude, longitude, is_active, approval_status)
       VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, TRUE, 'approved')
       RETURNING *`,
      [validUserId, userName, nowISO, status || "Present", location, latitude || null, longitude || null]
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
      status: status || "Present",
      location: location,
      is_active: true,
      approval_status: "approved",
    };

    LOCAL_ABSENSI_STORE.unshift(localRecord);
    return res.json({ success: true, absensi: localRecord });
  }
});

// 8. API Check-Out
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

// 9. API Submit Leave / Izin
app.post("/api/absensi/izin", async (req, res) => {
  const { userId, userName, type, note, startDate, endDate } = req.body;
  const validUserId = isUUID(userId) ? userId : null;

  if (!startDate) {
    return res.status(400).json({ success: false, message: "Tanggal izin wajib dipilih." });
  }

  const selectedStart = new Date(startDate);
  const ket = note ? `${type} — ${note}` : type;
  const finalStart = selectedStart.toISOString();
  const finalEnd = endDate ? new Date(endDate).toISOString() : finalStart;

  try {
    const result = await query(
      `INSERT INTO absensi (user_id, user_name, date, status, keterangan, is_active, start_date, end_date, approval_status)
       VALUES ($1, $2, $3::date, $4, $5, FALSE, $6, $7, 'pending')
       RETURNING *`,
      [validUserId, userName, startDate, type, ket, finalStart, finalEnd]
    );

    const record = result.rows[0];
    console.log("✅ Pengajuan Izin Berhasil Disimpan ke Neon DB (Pending):", record.id);
    return res.json({ success: true, absensi: record });
  } catch (err) {
    console.warn("📌 Izin DB Error:", err.message);

    const localRecord = {
      id: "izin-" + Date.now(),
      user_id: userId,
      user_name: userName,
      date: startDate,
      status: type,
      keterangan: ket,
      is_active: false,
      start_date: finalStart,
      end_date: finalEnd,
      approval_status: "pending",
    };

    LOCAL_ABSENSI_STORE.unshift(localRecord);
    return res.json({ success: true, absensi: localRecord });
  }
});

// 10. API Admin Get Pending Leave Requests
app.get("/api/admin/leaves", async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM absensi WHERE approval_status = 'pending' ORDER BY created_at DESC`
    );
    return res.json({ success: true, leaves: result.rows });
  } catch (err) {
    console.warn("Get pending leaves error:", err.message);
    const pendingLocal = LOCAL_ABSENSI_STORE.filter((a) => a.approval_status === "pending");
    return res.json({ success: true, leaves: pendingLocal });
  }
});

// 11. API Admin Approve Leave Request (Auto-expands every day in date range)
app.post("/api/admin/leaves/approve", async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "ID absensi wajib dikirim." });

  try {
    if (isUUID(id)) {
      const leaveCheck = await query(`SELECT * FROM absensi WHERE id = $1`, [id]);
      if (leaveCheck.rows.length > 0) {
        const leaveRow = leaveCheck.rows[0];
        await query(`UPDATE absensi SET approval_status = 'approved' WHERE id = $1`, [id]);

        // Auto expand every day in date range (e.g. Monday to Friday)
        if (leaveRow.start_date && leaveRow.end_date) {
          let curr = new Date(leaveRow.start_date);
          const end = new Date(leaveRow.end_date);
          curr.setHours(0, 0, 0, 0);
          end.setHours(0, 0, 0, 0);

          while (curr <= end) {
            const dateStr = curr.toISOString().split("T")[0];
            const existCheck = await query(
              `SELECT id FROM absensi WHERE user_id = $1 AND date = $2::date`,
              [leaveRow.user_id, dateStr]
            );

            if (existCheck.rows.length === 0) {
              await query(
                `INSERT INTO absensi (user_id, user_name, date, status, keterangan, is_active, start_date, end_date, approval_status)
                 VALUES ($1, $2, $3::date, $4, $5, FALSE, $6, $7, 'approved')`,
                [
                  leaveRow.user_id,
                  leaveRow.user_name,
                  dateStr,
                  leaveRow.status,
                  leaveRow.keterangan,
                  leaveRow.start_date,
                  leaveRow.end_date,
                ]
              );
            } else {
              await query(
                `UPDATE absensi SET status = $1, keterangan = $2, approval_status = 'approved' WHERE user_id = $3 AND date = $4::date`,
                [leaveRow.status, leaveRow.keterangan, leaveRow.user_id, dateStr]
              );
            }

            curr.setDate(curr.getDate() + 1);
          }
        }

        console.log("✅ Leave approved and expanded for all days in date range:", id);
        return res.json({ success: true, absensi: leaveRow });
      }
    }
  } catch (err) {
    console.warn("Approve leave DB error:", err.message);
  }

  // Memory store fallback
  const localItem = LOCAL_ABSENSI_STORE.find((a) => a.id === id);
  if (localItem) {
    localItem.approval_status = "approved";

    if (localItem.start_date && localItem.end_date) {
      let curr = new Date(localItem.start_date);
      const end = new Date(localItem.end_date);
      curr.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      while (curr <= end) {
        const dateStr = curr.toISOString().split("T")[0];
        const existing = LOCAL_ABSENSI_STORE.find(
          (a) => (a.user_id === localItem.user_id || a.user_name === localItem.user_name) && a.date === dateStr
        );

        if (!existing) {
          LOCAL_ABSENSI_STORE.push({
            id: "izin-day-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
            user_id: localItem.user_id,
            user_name: localItem.user_name,
            date: dateStr,
            status: localItem.status,
            keterangan: localItem.keterangan,
            is_active: false,
            start_date: localItem.start_date,
            end_date: localItem.end_date,
            approval_status: "approved",
          });
        } else {
          existing.status = localItem.status;
          existing.approval_status = "approved";
        }

        curr.setDate(curr.getDate() + 1);
      }
    }
  }

  return res.json({ success: true, absensi: localItem || null });
});

// 12. API Admin Decline Leave Request (With Decline Reason)
app.post("/api/admin/leaves/decline", async (req, res) => {
  const { id, reason } = req.body;
  if (!id) return res.status(400).json({ success: false, message: "ID absensi wajib dikirim." });

  try {
    if (isUUID(id)) {
      const result = await query(
        `UPDATE absensi SET approval_status = 'declined', decline_reason = $2 WHERE id = $1 RETURNING *`,
        [id, reason || "Tidak mendapatkan izin"]
      );
      if (result.rows.length > 0) {
        return res.json({ success: true, absensi: result.rows[0] });
      }
    }
  } catch (err) {
    console.warn("Decline leave DB error:", err.message);
  }

  const localItem = LOCAL_ABSENSI_STORE.find((a) => a.id === id);
  if (localItem) {
    localItem.approval_status = "declined";
    localItem.decline_reason = reason || "Tidak mendapatkan izin";
  }
  return res.json({ success: true, absensi: localItem || null });
});

// 13. API Admin Export Monthly Attendance Recap
app.get("/api/admin/export-recap", async (req, res) => {
  const { userId, userName, month } = req.query; // month in format 'YYYY-MM'
  try {
    let sql = `SELECT * FROM absensi WHERE 1=1`;
    const params = [];

    if (userId && isUUID(userId)) {
      params.push(userId);
      sql += ` AND user_id = $${params.length}`;
    } else if (userName && userName !== "semua") {
      params.push(userName);
      sql += ` AND user_name = $${params.length}`;
    }

    if (month) {
      params.push(`${month}%`);
      sql += ` AND (to_char(date, 'YYYY-MM') LIKE $${params.length} OR to_char(created_at, 'YYYY-MM') LIKE $${params.length} OR to_char(start_date, 'YYYY-MM') LIKE $${params.length})`;
    }

    sql += ` ORDER BY date DESC, created_at DESC`;

    const result = await query(sql, params);
    const records = result.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      user_name: row.user_name || "Karyawan",
      date: formatDateWIB(row.date || row.start_date || row.created_at),
      raw_date: row.date || row.created_at,
      check_in: formatTimeWIB(row.check_in),
      check_out: formatTimeWIB(row.check_out),
      status: row.status,
      duration: row.duration || "—",
      location: row.location || row.keterangan || "—",
      keterangan: row.keterangan || "—",
      approval_status: row.approval_status || "approved",
      decline_reason: row.decline_reason || "—",
    }));

    return res.json({ success: true, records });
  } catch (err) {
    console.warn("Export recap DB query error:", err.message);
    return res.json({ success: false, records: [] });
  }
});

// 14. API Work Settings
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
