import React, { useState, useEffect } from "react";
import { CalendarDays, MapPin, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import { APPROVAL_STATUS_META } from "../../constants/dummyData";
import { fetchAbsensiHistory } from "../../services/api";

export default function EmployeeHistory({ currentUser }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("semua");
  const filters = ["semua", "Present", "Late", "Izin / Cuti"];

  const loadHistory = async () => {
    setLoading(true);
    const data = await fetchAbsensiHistory(currentUser?.id, currentUser?.name);
    setHistory(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser]);

  const filtered = history.filter((h) => {
    if (filter === "semua") return true;
    if (filter === "Present") return h.status === "Present" || h.status === "hadir";
    if (filter === "Late") return h.status === "Late" || h.status === "telat";
    if (filter === "Izin / Cuti") return h.status !== "Present" && h.status !== "hadir" && h.status !== "Late" && h.status !== "telat";
    return true;
  });

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
        Data Kehadiran & Pengajuan Izin
      </p>

      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-none pb-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold font-body whitespace-nowrap transition-colors"
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
          {filtered.map((h, i) => {
            const approvalMeta = APPROVAL_STATUS_META[h.approval_status] || APPROVAL_STATUS_META.approved;

            return (
              <div key={h.id || i} className="rounded-xl px-4 py-3.5" style={{ backgroundColor: "#142C46" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} style={{ color: "#93A6BD" }} />
                    <p className="text-sm font-semibold" style={{ color: "#F6F1E7" }}>
                      {h.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={h.status} />
                    {h.approval_status && h.approval_status !== "approved" && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ color: approvalMeta.color, backgroundColor: approvalMeta.bg }}
                      >
                        {approvalMeta.label}
                      </span>
                    )}
                  </div>
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

                {/* Decline Reason Display */}
                {h.approval_status === "declined" && h.decline_reason && (
                  <div
                    className="mt-2.5 p-2.5 rounded-lg text-xs flex items-start gap-1.5"
                    style={{ backgroundColor: "rgba(235,87,87,0.12)", color: "#EB5757", border: "1px solid rgba(235,87,87,0.2)" }}
                  >
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Alasan Penolakan Admin:</span>
                      <span>{h.decline_reason}</span>
                    </div>
                  </div>
                )}

                {h.location && (
                  <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: "#93A6BD" }}>
                    <MapPin size={11} />
                    <span>{h.location}</span>
                  </div>
                )}
              </div>
            );
          })}

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
