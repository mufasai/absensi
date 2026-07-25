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
  FileSpreadsheet,
  Download,
  Filter,
} from "lucide-react";
import Avatar from "../common/Avatar";
import StatusBadge from "../common/StatusBadge";
import {
  fetchAdminDashboard,
  fetchPendingLeaves,
  approveLeave,
  declineLeave,
  fetchExportRecap,
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

  // Export Excel State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("semua");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const YYYY = today.getFullYear();
    const MM = String(today.getMonth() + 1).padStart(2, "0");
    return `${YYYY}-${MM}`;
  });
  const [exporting, setExporting] = useState(false);

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

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const records = await fetchExportRecap({
        userName: selectedEmp === "semua" ? null : selectedEmp,
        month: selectedMonth,
      });

      if (!records || records.length === 0) {
        alert("Tidak ada data presensi yang ditemukan untuk filter karyawan dan bulan ini.");
        setExporting(false);
        return;
      }

      // Import SheetJS dynamically
      const XLSX = await import("xlsx");

      // Prepare formatted rows
      const sheetData = records.map((r, idx) => ({
        "No": idx + 1,
        "Tanggal": r.date,
        "Nama Karyawan": r.user_name,
        "Jam Masuk": r.check_in,
        "Jam Keluar": r.check_out,
        "Status Presensi": r.status,
        "Durasi Kerja": r.duration,
        "Keterangan / Lokasi": r.keterangan || r.location || "—",
        "Status Persetujuan":
          r.approval_status === "approved"
            ? "Disetujui"
            : r.approval_status === "declined"
            ? "Ditolak"
            : "Pending",
        "Alasan Penolakan": r.decline_reason || "—",
      }));

      const ws = XLSX.utils.json_to_sheet(sheetData);

      // Width formatting
      ws["!cols"] = [
        { wch: 5 },
        { wch: 16 },
        { wch: 24 },
        { wch: 12 },
        { wch: 12 },
        { wch: 28 },
        { wch: 14 },
        { wch: 35 },
        { wch: 18 },
        { wch: 30 },
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rekap Presensi");

      const empLabel = selectedEmp === "semua" ? "Semua_Karyawan" : selectedEmp.replace(/\s+/g, "_");
      const fileName = `Rekap_Absensi_${empLabel}_${selectedMonth}.xlsx`;

      XLSX.writeFile(wb, fileName);
      setExportModalOpen(false);
    } catch (e) {
      console.error("Export Excel error:", e);
      alert("Gagal mengeksport file Excel: " + e.message);
    }
    setExporting(false);
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

      {/* Export Excel Modal */}
      {exportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(11,29,48,0.8)" }}
          onClick={() => setExportModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-5 fade-in-up"
            style={{ backgroundColor: "#142C46", border: "1px solid rgba(97,190,125,0.3)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={18} style={{ color: "#61BE7D" }} />
                <p className="font-display font-bold text-base" style={{ color: "#F6F1E7" }}>
                  Export Rekap Absensi (.xlsx)
                </p>
              </div>
              <button onClick={() => setExportModalOpen(false)}>
                <X size={18} style={{ color: "#93A6BD" }} />
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: "#93A6BD" }}>
              Filter karyawan dan bulan presensi untuk mengunduh laporan Excel bulanan.
            </p>

            {/* Filter Karyawan Dropdown */}
            <div className="mb-4">
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
                <Filter size={12} />
                <span>Pilih Karyawan</span>
              </label>
              <select
                value={selectedEmp}
                onChange={(e) => setSelectedEmp(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-body outline-none cursor-pointer"
                style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
              >
                <option value="semua">Semua Karyawan</option>
                {teamList.map((t) => (
                  <option key={t.id || t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Month */}
            <div className="mb-6">
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
                <Calendar size={12} />
                <span>Pilih Bulan & Tahun</span>
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-body outline-none"
                style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
              />
            </div>

            <button
              type="button"
              disabled={exporting}
              onClick={handleExportExcel}
              className="w-full py-3 rounded-xl font-display font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md"
              style={{ backgroundColor: "#61BE7D", color: "#0B1D30" }}
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memproses File Excel...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download File Excel (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Row 1: Segmented Navigation Tab Switcher */}
      <div className="grid grid-cols-2 gap-2 mb-3 p-1 rounded-2xl" style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.15)" }}>
        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className="py-2.5 px-3 rounded-xl text-xs font-bold font-body transition-all text-center flex items-center justify-center gap-1.5"
          style={
            activeTab === "attendance"
              ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
              : { color: "#93A6BD" }
          }
        >
          <span>Presensi Hari Ini</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pending_leaves")}
          className="py-2.5 px-3 rounded-xl text-xs font-bold font-body transition-all text-center flex items-center justify-center gap-1.5"
          style={
            activeTab === "pending_leaves"
              ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
              : { color: "#93A6BD" }
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

      {/* Row 2: Action Controls Bar (Export Excel, Legenda Status & Refresh) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm"
            style={{ backgroundColor: "rgba(97,190,125,0.15)", color: "#61BE7D", border: "1px solid rgba(97,190,125,0.3)" }}
          >
            <FileSpreadsheet size={14} className="shrink-0" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all"
            style={{ backgroundColor: "#142C46", color: "#56CCF2", border: "1px solid rgba(86,204,242,0.2)" }}
          >
            <Info size={14} className="shrink-0" />
            <span>Legenda Status</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-transform active:scale-95 ml-auto"
          style={{ backgroundColor: "#142C46", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
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
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-transform active:scale-95 shadow-sm"
                  style={{ backgroundColor: "#61BE7D", color: "#0B1D30" }}
                >
                  <Check size={14} />
                  <span>Accept</span>
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={() => handleOpenDeclineModal(leave.id)}
                  className="flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold transition-transform active:scale-95 shadow-sm"
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
