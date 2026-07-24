import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Search, MapPin, Loader2, RefreshCw } from "lucide-react";
import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import { fetchAdminDashboard } from "../../services/api";

export default function AdminDashboard() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({ hadir: 0, telat: 0, izin: 0, totalKaryawan: 0 });
  const [teamList, setTeamList] = useState([]);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchAdminDashboard();
    if (data && data.success) {
      setStatsData(data.stats || { hadir: 0, telat: 0, izin: 0, totalKaryawan: 0 });
      setTeamList(data.team || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTeam = teamList.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  const stats = [
    { label: "Hadir Hari Ini", value: statsData.hadir, color: "#45B787", Icon: CheckCircle2 },
    { label: "Telat", value: statsData.telat, color: "#F2B705", Icon: AlertCircle },
    { label: "Izin", value: statsData.izin, color: "#93A6BD", Icon: AlertCircle },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium" style={{ color: "#93A6BD" }}>
          Data Kehadiran
        </p>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-transform active:scale-95"
          style={{ backgroundColor: "#142C46", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Information Cards: Hadir, Telat, Izin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: "#142C46" }}>
            <s.Icon size={16} style={{ color: s.color }} className="mb-2" />
            <p className="font-display font-bold text-2xl" style={{ color: s.color }}>
              {s.value}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#93A6BD" }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 mb-4"
        style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.12)" }}
      >
        <Search size={16} style={{ color: "#93A6BD" }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari nama karyawan..."
          className="w-full bg-transparent outline-none text-sm font-body"
          style={{ color: "#F6F1E7" }}
        />
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#142C46" }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-sm" style={{ color: "#93A6BD" }}>
            <Loader2 size={24} className="animate-spin mb-2" />
            <span>Memuat data kehadiran karyawan dari database...</span>
          </div>
        ) : (
          filteredTeam.map((t, i) => (
            <div
              key={t.id || i}
              className="flex items-center justify-between gap-3 px-4 py-3.5"
              style={{ borderTop: i === 0 ? "none" : "1px solid rgba(147,166,189,0.08)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar initials={t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")} size={34} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#F6F1E7" }}>
                    {t.name}
                  </p>
                  <p className="text-xs truncate flex items-center gap-1" style={{ color: "#93A6BD" }}>
                    {t.keterangan ? (
                      t.keterangan
                    ) : (
                      <>
                        <span className="font-mono">{t.in}</span>
                        {t.location && (
                          <>
                            <span>·</span>
                            <MapPin size={10} className="shrink-0" />
                            <span className="truncate">{t.location}</span>
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>
          ))
        )}

        {!loading && filteredTeam.length === 0 && (
          <p className="text-center text-sm py-10" style={{ color: "#93A6BD" }}>
            Belum ada data presensi karyawan hari ini.
          </p>
        )}
      </div>
    </div>
  );
}
