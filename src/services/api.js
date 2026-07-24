const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

/**
 * Service API untuk Autentikasi & Data Real-time Neon Database
 */

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Gagal masuk.");
  }
  return data;
}

export async function registerUser(name, email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Gagal melakukan pendaftaran.");
  }
  return data;
}

export async function fetchAdminDashboard() {
  try {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  } catch (err) {
    console.warn("API Error fetchAdminDashboard:", err.message);
    return { success: false, stats: { hadir: 0, telat: 0, izin: 0 }, team: [] };
  }
}

export async function fetchAbsensiHistory(userId, userName) {
  try {
    let url = `${API_BASE_URL}/absensi/history`;
    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (userName) params.append("userName", userName);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data.history || [];
  } catch (err) {
    console.warn("API Error fetchAbsensiHistory:", err.message);
    return [];
  }
}

export async function postCheckIn(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/absensi/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn("API Error postCheckIn:", err.message);
    return { success: false };
  }
}

export async function postCheckOut(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/absensi/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn("API Error postCheckOut:", err.message);
    return { success: false };
  }
}

export async function postIzin(payload) {
  try {
    const res = await fetch(`${API_BASE_URL}/absensi/izin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.warn("API Error postIzin:", err.message);
    return { success: false };
  }
}

export async function fetchWorkSettings() {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`);
    return await res.json();
  } catch (err) {
    return { jamMasuk: "09:00", toleransi: 15, jamPulang: "17:30" };
  }
}

export async function updateWorkSettings(settings) {
  try {
    const res = await fetch(`${API_BASE_URL}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    return await res.json();
  } catch (err) {
    return settings;
  }
}
