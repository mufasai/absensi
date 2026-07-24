import React, { useState, useEffect } from "react";
import { CalendarDays, MapPin, Loader2, RefreshCw } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import { fetchAbsensiHistory } from "../../services/api";

export default function EmployeeHistory({ currentUser }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("semua");
  const filters = ["semua", "hadir", "telat", "izin", "alpha"];

  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchAbsensiHistory(currentUser?.id, currentUser?.name);
    setHistory(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser]);

  const filtered = filter === "semua" ? history : history.filter((h) => h.status === filter);

  return (
    <div className="px-5 pt-6 pb-4">
      <div className="flex items-center justify-between mb-1">
        <p className="font-display font-bold text-xl" style={{ color: "#F6F1E7" }}>
          Riwayat Absensi
        </p>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-transform active:scale-95"
          style={{ backgroundColor: "#142C46", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: "#93A6BD" }}>
        Data Kehadiran
      </p>

      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold font-body capitalize whitespace-nowrap transition-colors"
            style={
              filter === f
                ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
                : { backgroundColor: "#142C46", color: "#93A6BD" }
            }
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-sm" style={{ color: "#93A6BD" }}>
          <Loader2 size={24} className="animate-spin mb-2" />
          <span>Memuat riwayat presensi...</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((h, i) => (
            <div key={h.id || i} className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#142C46" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays size={14} style={{ color: "#93A6BD" }} />
                  <p className="text-sm font-semibold" style={{ color: "#F6F1E7" }}>
                    {h.date}
                  </p>
                </div>
                <StatusBadge status={h.status} />
              </div>

              {h.keterangan ? (
                <p className="text-xs" style={{ color: "#93A6BD" }}>
                  Keterangan: <span style={{ color: "#F6F1E7" }}>{h.keterangan}</span>
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs" style={{ color: "#93A6BD" }}>
                  <span>Masuk: {h.in}</span>
                  <span>Keluar: {h.out}</span>
                  <span>Durasi: {h.duration}</span>
                </div>
              )}
              {h.location && (
                <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: "#93A6BD" }}>
                  <MapPin size={11} />
                  <span>{h.location}</span>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-sm py-10" style={{ color: "#93A6BD" }}>
              Belum ada riwayat data presensi.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
