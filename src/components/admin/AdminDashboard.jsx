import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Search,
  MapPin,
  Loader2,
  RefreshCw,
  Info,
  Check,
  X,
  Calendar,
  MessageSquare,
  FileCheck,
} from "lucide-react";
import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import {
  fetchAdminDashboard,
  fetchPendingLeaves,
  approveLeave,
  declineLeave,
} from "../../services/api";

const LEGEND_ITEMS = [
  "Present",
  "Late",
  "Excused absence (1 Day)",
  "Excused absence (Half Day)",
  "Unexcused absence",
  "Day Off",
  "Sick",
  "Work From Anywhere/Home",
  "Out of Office (Work)",
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("attendance"); // 'attendance' | 'pending_leaves'
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [statsData, setStatsData] = useState({ hadir: 0, telat: 0, izin: 0, totalKaryawan: 0 });
  const [teamList, setTeamList] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);

  // Decline Reason Modal State
  const [declineModalOpen, setDeclineModalOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [declineReason, setDeclineReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [dashRes, leavesRes] = await Promise.all([
      fetchAdminDashboard(),
      fetchPendingLeaves(),
    ]);

    if (dashRes && dashRes.success) {
      setStatsData(dashRes.stats || { hadir: 0, telat: 0, izin: 0, totalKaryawan: 0 });
      setTeamList(dashRes.team || []);
    }

    if (leavesRes) {
      setPendingLeaves(leavesRes);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTeam = teamList.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  const handleApprove = async (id) => {
    setSubmittingAction(true);
    await approveLeave(id);
    await loadData();
    setSubmittingAction(false);
  };

  const handleOpenDeclineModal = (id) => {
    setSelectedLeaveId(id);
    setDeclineReason("");
    setDeclineModalOpen(true);
  };

  const handleConfirmDecline = async () => {
    if (!selectedLeaveId) return;
    setSubmittingAction(true);
    await declineLeave(selectedLeaveId, declineReason || "Izin tidak disetujui oleh admin");
    setDeclineModalOpen(false);
    setSelectedLeaveId(null);
    setDeclineReason("");
    await loadData();
    setSubmittingAction(false);
  };

  const stats = [
    { label: "Present (Hadir)", value: statsData.hadir, color: "#61BE7D", Icon: CheckCircle2 },
    { label: "Late (Telat)", value: statsData.telat, color: "#F2C94C", Icon: AlertCircle },
    { label: "Pending Izin", value: pendingLeaves.length, color: "#56CCF2", Icon: FileCheck },
  ];

  return (
    <div>
      {/* Decline Reason Modal */}
      {declineModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(11,29,48,0.8)" }}
          onClick={() => setDeclineModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl p-5 fade-in-up"
            style={{ backgroundColor: "#142C46", border: "1px solid rgba(235,87,87,0.3)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-display font-bold text-sm" style={{ color: "#F6F1E7" }}>
                Tolak Pengajuan Izin
              </p>
              <button onClick={() => setDeclineModalOpen(false)}>
                <X size={16} style={{ color: "#93A6BD" }} />
              </button>
            </div>
            <p className="text-xs mb-3" style={{ color: "#93A6BD" }}>
              Berikan alasan penolakan untuk karyawan (misal: "Hanya disetujui 1 hari, silakan ajukan ulang").
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              placeholder="Tuliskan alasan penolakan..."
              className="w-full mb-4 px-3 py-2 rounded-xl text-xs font-body outline-none resize-none"
              style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeclineModalOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: "#1E3A5C", color: "#93A6BD" }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleConfirmDecline}
                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-transform active:scale-95"
                style={{ backgroundColor: "#EB5757", color: "#FFFFFF" }}
              >
                {submittingAction ? "Kirim..." : "Konfirmasi Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("attendance")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={
              activeTab === "attendance"
                ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
                : { backgroundColor: "#142C46", color: "#93A6BD" }
            }
          >
            Presensi Hari Ini
          </button>
          <button
            onClick={() => setActiveTab("pending_leaves")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={
              activeTab === "pending_leaves"
                ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
                : { backgroundColor: "#142C46", color: "#93A6BD" }
            }
          >
            <span>Persetujuan Izin</span>
            {pendingLeaves.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full font-bold bg-amber-400 text-slate-900">
                {pendingLeaves.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: "#142C46", color: "#56CCF2", border: "1px solid rgba(86,204,242,0.2)" }}
          >
            <Info size={12} />
            <span className="hidden sm:inline">Legenda Warna Status</span>
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-transform active:scale-95"
            style={{ backgroundColor: "#142C46", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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

      {/* Legenda Warna Status Accordion */}
      {showLegend && (
        <div
          className="rounded-xl p-4 mb-4 fade-in-up"
          style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.15)" }}
        >
          <p className="text-xs font-bold font-display mb-3" style={{ color: "#F6F1E7" }}>
            Legenda Warna Status Kehadiran:
          </p>
          <div className="flex flex-wrap gap-2">
            {LEGEND_ITEMS.map((item) => (
              <StatusBadge key={item} status={item} />
            ))}
          </div>
        </div>
      )}

      {/* TAB 1: PRESENSI HARI INI */}
      {activeTab === "attendance" && (
        <>
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
                <span>Memuat data kehadiran karyawan...</span>
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
        </>
      )}

      {/* TAB 2: PERSETUJUAN IZIN (PENDING LEAVES) */}
      {activeTab === "pending_leaves" && (
        <div className="space-y-3">
          {pendingLeaves.map((leave) => (
            <div
              key={leave.id}
              className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 fade-in-up"
              style={{ backgroundColor: "#142C46", border: "1px solid rgba(240,146,61,0.2)" }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm" style={{ color: "#F6F1E7" }}>
                    {leave.user_name || "Karyawan"}
                  </p>
                  <StatusBadge status={leave.status} />
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "#93A6BD" }}>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(leave.start_date || leave.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    {leave.end_date && ` - ${new Date(leave.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                  </span>
                </div>
                {leave.keterangan && (
                  <p className="text-xs flex items-center gap-1" style={{ color: "#F0923D" }}>
                    <MessageSquare size={12} className="shrink-0" />
                    <span>{leave.keterangan}</span>
                  </p>
                )}
              </div>

              {/* Action Buttons: Accept & Decline */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleApprove(leave.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-transform active:scale-95"
                  style={{ backgroundColor: "#61BE7D", color: "#0B1D30" }}
                >
                  <Check size={14} />
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleOpenDeclineModal(leave.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-transform active:scale-95"
                  style={{ backgroundColor: "rgba(235,87,87,0.15)", color: "#EB5757", border: "1px solid rgba(235,87,87,0.3)" }}
                >
                  <X size={14} />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          ))}

          {pendingLeaves.length === 0 && (
            <div className="text-center py-12 rounded-xl" style={{ backgroundColor: "#142C46" }}>
              <FileCheck size={28} className="mx-auto mb-2 opacity-50" style={{ color: "#61BE7D" }} />
              <p className="text-sm font-semibold" style={{ color: "#F6F1E7" }}>
                Tidak Ada Pengajuan Izin Pending
              </p>
              <p className="text-xs mt-1" style={{ color: "#93A6BD" }}>
                Semua pengajuan izin karyawan sudah ditinjau.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
