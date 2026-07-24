import React, { useState, useEffect } from "react";
import { LogOut, Loader2 } from "lucide-react";
import Avatar from "../common/Avatar";
import { fetchAbsensiHistory } from "../../services/api";

export default function EmployeeProfile({ currentUser, onLogout }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const data = await fetchAbsensiHistory(currentUser?.id);
      setHistory(data || []);
      setLoading(false);
    }
    loadStats();
  }, [currentUser]);

  const userName = currentUser?.name || "Dimas Prayoga";
  const userInitials = currentUser?.initials || userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const userEmail = currentUser?.email || "karyawan@perusahaan.com";

  const hadirCount = history.filter((h) => h.status === "hadir").length;
  const telatCount = history.filter((h) => h.status === "telat").length;

  return (
    <div className="px-5 pt-6 pb-4">
      <p className="font-display font-bold text-xl mb-5" style={{ color: "#F6F1E7" }}>
        Profil Karyawan
      </p>

      <div
        className="rounded-2xl p-5 mb-5 flex items-center gap-4"
        style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.12)" }}
      >
        <Avatar initials={userInitials} size={56} />
        <div>
          <p className="font-display font-bold text-base" style={{ color: "#F6F1E7" }}>
            {userName}
          </p>
          <p className="text-sm" style={{ color: "#93A6BD" }}>
            {userEmail}
          </p>
          <p className="text-xs font-mono mt-0.5" style={{ color: "#F0923D" }}>
            Status: Karyawan Aktif
          </p>
        </div>
      </div>

      <p className="text-xs font-semibold mb-2" style={{ color: "#93A6BD" }}>
        Statistik Kehadiran:
      </p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl p-4" style={{ backgroundColor: "#142C46" }}>
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <p className="font-display font-bold text-2xl" style={{ color: "#45B787" }}>
              {hadirCount}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "#93A6BD" }}>
            Hadir bulan ini
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "#142C46" }}>
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <p className="font-display font-bold text-2xl" style={{ color: "#F2B705" }}>
              {telatCount}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "#93A6BD" }}>
            Kali telat
          </p>
        </div>
      </div>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-semibold text-sm transition-transform active:scale-95"
        style={{ backgroundColor: "rgba(224,81,46,0.14)", color: "#E0512E" }}
      >
        <LogOut size={16} />
        Keluar Akun
      </button>
    </div>
  );
}
