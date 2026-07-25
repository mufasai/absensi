import React, { useState, useEffect, useMemo } from "react";
import { Clock, MapPin, Loader2 } from "lucide-react";
import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import IzinModal from "../modals/IzinModal";
import { timeStrToMinutes } from "../../utils/timeUtils";
import { requestLocationPermission, getStreetAddress } from "../../services/location";
import { postCheckIn, postCheckOut, postIzin, fetchAbsensiHistory, fetchWorkSettings } from "../../services/api";

const ACTIVE_SESSION_KEY = "absensi_active_checkin_session";

export default function EmployeeHome({ currentUser, workSettings, onAddHistory }) {
  const [now, setNow] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const [currentAbsensiId, setCurrentAbsensiId] = useState(null);
  const [pressed, setPressed] = useState(false);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [showIzin, setShowIzin] = useState(false);
  const [recentHistory, setRecentHistory] = useState([]);
  const [currentSettings, setCurrentSettings] = useState(workSettings || { jamMasuk: "09:00", toleransi: 15 });

  const userName = currentUser?.name || "Karyawan";
  const userInitials = currentUser?.initials || userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  // Load recent history belonging STRICTLY to current user from Neon DB
  const loadRecentHistory = async () => {
    const data = await fetchAbsensiHistory(currentUser?.id, currentUser?.name);
    setRecentHistory(data.slice(0, 4));
  };

  // Sync prop changes or fetch fresh work settings
  useEffect(() => {
    if (workSettings) {
      setCurrentSettings(workSettings);
    }
  }, [workSettings]);

  // 1. Clock Timer (Memperbarui setiap 1 detik secara live)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 2. Prompt Location & Restore Session & Load Settings
  useEffect(() => {
    async function loadFreshSettings() {
      const data = await fetchWorkSettings();
      if (data && (data.jamMasuk || data.toleransi)) {
        setCurrentSettings(data);
      }
    }

    loadFreshSettings();
    requestLocationPermission();
    loadRecentHistory();

    try {
      const savedSession = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        if (sessionData && sessionData.checkInTime) {
          setCheckedIn(true);
          setCheckInTime(new Date(sessionData.checkInTime));
          setCheckInStatus(sessionData.status || "hadir");
          setLocation(sessionData.location || "Lokasi Kantor");
          setCurrentAbsensiId(sessionData.absensiId || null);
        }
      }
    } catch (err) {
      console.warn("Gagal membaca sesi tersimpan:", err);
    }
  }, [currentUser]);

  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const jamMasuk = currentSettings?.jamMasuk || "09:00";
  const toleransi = currentSettings?.toleransi || 15;
  const batasMasuk = timeStrToMinutes(jamMasuk) + Number(toleransi);

  // Live Timer: Hitung durasi jam, menit, dan detik secara real-time setiap detik!
  const elapsed = useMemo(() => {
    if (!checkedIn || !checkInTime) return "0j 00m 00s";
    const diffMs = Math.max(0, now.getTime() - checkInTime.getTime());
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    const s = Math.floor((diffMs % 60000) / 1000);
    return `${h}j ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  }, [checkedIn, checkInTime, now]);

  const handleStamp = async () => {
    setPressed(true);
    setTimeout(() => setPressed(false), 450);

    const currentTimeStamp = new Date();

    if (!checkedIn) {
      // CHECK IN REAL TO NEON DB
      setLocating(true);
      const locResult = await requestLocationPermission();
      let streetName = "Kantor Pusat, Jakarta";
      let isLocErr = false;

      if (locResult.granted && locResult.lat && locResult.lng) {
        streetName = await getStreetAddress(locResult.lat, locResult.lng);
      } else {
        isLocErr = true;
      }

      setLocating(false);

      const nowMinutes = currentTimeStamp.getHours() * 60 + currentTimeStamp.getMinutes();
      const status = nowMinutes > batasMasuk ? "Late" : "Present";

      // Call API Check-in
      const apiRes = await postCheckIn({
        userId: currentUser?.id,
        userName: userName,
        status: status,
        location: streetName,
        latitude: locResult.lat || null,
        longitude: locResult.lng || null,
      });

      const dbAbsensiId = apiRes && apiRes.absensi ? apiRes.absensi.id : null;

      setCheckedIn(true);
      setCheckInTime(currentTimeStamp);
      setCheckInStatus(status);
      setLocation(streetName);
      setLocationError(isLocErr);
      setCurrentAbsensiId(dbAbsensiId);

      localStorage.setItem(
        ACTIVE_SESSION_KEY,
        JSON.stringify({
          checkInTime: currentTimeStamp.toISOString(),
          status: status,
          location: streetName,
          absensiId: dbAbsensiId,
        })
      );

      loadRecentHistory();
    } else {
      // CHECK OUT REAL TO NEON DB
      const entryDate = currentTimeStamp.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
      const inStr = checkInTime ? checkInTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "—";
      const outStr = currentTimeStamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      await postCheckOut({
        absensiId: currentAbsensiId,
        userId: currentUser?.id,
        duration: elapsed,
      });

      if (onAddHistory) {
        onAddHistory({
          date: entryDate,
          in: inStr,
          out: outStr,
          status: checkInStatus,
          duration: elapsed,
          location: location,
          keterangan: null,
        });
      }

      localStorage.removeItem(ACTIVE_SESSION_KEY);

      setCheckedIn(false);
      setCheckInTime(null);
      setCheckInStatus(null);
      setLocation(null);
      setCurrentAbsensiId(null);
      loadRecentHistory();
    }
  };

  const handleIzinSubmit = async (type, note) => {
    await postIzin({
      userId: currentUser?.id,
      userName: userName,
      type: type,
      note: note,
    });
    setShowIzin(false);
    loadRecentHistory();
  };

  return (
    <div className="px-5 pt-6 pb-4">
      {showIzin && <IzinModal onClose={() => setShowIzin(false)} onSubmit={handleIzinSubmit} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm" style={{ color: "#93A6BD" }}>
            Selamat datang kembali,
          </p>
          <p className="font-display font-bold text-lg" style={{ color: "#F6F1E7" }}>
            {userName.split(" ")[0]} 👋
          </p>
        </div>
        <Avatar initials={userInitials} size={44} />
      </div>

      {/* Clock Card */}
      <div
        className="rounded-2xl p-5 mb-4 text-center"
        style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.12)" }}
      >
        <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: "#93A6BD" }}>
          {dateStr}
        </p>
        <p className="font-mono font-semibold text-4xl tracking-tight" style={{ color: "#F6F1E7" }}>
          {timeStr}
        </p>
        <p className="text-xs mt-2 font-medium" style={{ color: "#93A6BD" }}>
          Jam masuk: <span className="font-mono font-bold text-white">{jamMasuk}</span> · toleransi{" "}
          <span className="font-bold text-white">{toleransi}</span> menit
        </p>
      </div>

      {/* Stamp Button */}
      <div className="flex flex-col items-center mb-3">
        <button
          onClick={handleStamp}
          disabled={locating}
          className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center font-display font-bold transition-transform active:scale-95 shadow-xl ${
            pressed ? "stamp-press" : ""
          } ${!checkedIn ? "stamp-ring" : ""}`}
          style={{
            background: checkedIn ? "#1E3A5C" : "linear-gradient(135deg, #F0923D, #E0512E)",
            color: checkedIn ? "#F6F1E7" : "#0B1D30",
            border: checkedIn ? "2px solid rgba(240,146,61,0.5)" : "none",
          }}
        >
          {locating ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="animate-spin" strokeWidth={2.2} />
              <span className="text-xs font-normal">Mencari Jalan...</span>
            </div>
          ) : (
            <>
              <Clock size={28} strokeWidth={2.2} className="mb-1.5" />
              <span className="text-base">{checkedIn ? "Check Out" : "Check In"}</span>
              {checkedIn && (
                <span className="font-mono text-xs mt-1 font-semibold" style={{ color: "#F0923D" }}>
                  {elapsed}
                </span>
              )}
            </>
          )}
        </button>

        {checkedIn && checkInStatus && (
          <div className="mt-3">
            <StatusBadge status={checkInStatus} />
          </div>
        )}

        <div className="text-xs mt-3 text-center max-w-[280px]" style={{ color: "#93A6BD" }}>
          {locating && "Mendeteksi nama jalan & lokasi kamu..."}
          {!locating && checkedIn && (
            <div className="space-y-1 fade-in-up">
              <p>
                Check-in pukul{" "}
                <span className="font-mono font-semibold" style={{ color: "#F6F1E7" }}>
                  {checkInTime?.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </p>
              <div className="flex items-center justify-center gap-1 font-semibold text-xs" style={{ color: "#F0923D" }}>
                <MapPin size={12} className="shrink-0" />
                <span className="truncate max-w-[240px]">{location}</span>
              </div>
            </div>
          )}
          {!locating && !checkedIn && "Tekan tombol untuk mulai presensi hari ini"}
        </div>
      </div>

      <button
        onClick={() => setShowIzin(true)}
        className="w-full py-2.5 rounded-xl font-display font-semibold text-xs mb-6 transition-transform active:scale-95"
        style={{ backgroundColor: "#142C46", color: "#93A6BD", border: "1px solid rgba(147,166,189,0.15)" }}
      >
        Ajukan Izin / Cuti
      </button>

      <div className="flex items-center justify-between mb-3">
        <p className="font-display font-semibold text-sm" style={{ color: "#F6F1E7" }}>
          Aktivitas Terakhir
        </p>
      </div>
      <div className="space-y-2">
        {recentHistory.map((h, i) => (
          <div key={h.id || i} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: "#142C46" }}>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#F6F1E7" }}>
                {h.date}
              </p>
              <p className="font-mono text-xs mt-0.5 truncate" style={{ color: "#93A6BD" }}>
                {h.keterangan ? h.keterangan : `${h.in} — ${h.out}`}
              </p>
            </div>
            <StatusBadge status={h.status} />
          </div>
        ))}
        {recentHistory.length === 0 && (
          <p className="text-center text-xs py-4" style={{ color: "#93A6BD" }}>
            Belum ada aktivitas presensi.
          </p>
        )}
      </div>
    </div>
  );
}
