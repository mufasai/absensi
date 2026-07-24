import React, { useState, useEffect } from "react";
import { Check, Loader2 } from "lucide-react";
import { timeStrToMinutes } from "../../utils/timeUtils";
import { fetchWorkSettings, updateWorkSettings } from "../../services/api";

export default function AdminSettings({ workSettings, setWorkSettings }) {
  const [draft, setDraft] = useState(workSettings);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const data = await fetchWorkSettings();
      if (data) {
        setDraft(data);
        if (setWorkSettings) setWorkSettings(data);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const updated = await updateWorkSettings(draft);
    setLoading(false);
    setDraft(updated);
    if (setWorkSettings) setWorkSettings(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      <div
        className="rounded-2xl p-5 mb-4"
        style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.12)" }}
      >
        <p className="font-display font-semibold text-sm mb-1" style={{ color: "#F6F1E7" }}>
          Jam Kerja Standar
        </p>
        <p className="text-xs mb-5" style={{ color: "#93A6BD" }}>
          Patokan ini menentukan status "Tepat Waktu" atau "Telat" saat karyawan check-in.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#93A6BD" }}>
              Jam Masuk
            </label>
            <input
              type="time"
              value={draft.jamMasuk || "09:00"}
              onChange={(e) => setDraft({ ...draft, jamMasuk: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
              style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#93A6BD" }}>
              Toleransi (menit)
            </label>
            <input
              type="number"
              min={0}
              value={draft.toleransi || 15}
              onChange={(e) => setDraft({ ...draft, toleransi: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
              style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#93A6BD" }}>
              Jam Pulang
            </label>
            <input
              type="time"
              value={draft.jamPulang || "17:30"}
              onChange={(e) => setDraft({ ...draft, jamPulang: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-mono outline-none"
              style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
            />
          </div>
        </div>

        <p className="text-xs mt-4" style={{ color: "#93A6BD" }}>
          Contoh: jam masuk <span className="font-mono" style={{ color: "#F6F1E7" }}>{draft.jamMasuk}</span> dengan
          toleransi <span className="font-mono" style={{ color: "#F6F1E7" }}>{draft.toleransi}</span> menit berarti
          karyawan dianggap telat jika check-in setelah{" "}
          <span className="font-mono" style={{ color: "#F0923D" }}>
            {(() => {
              const total = timeStrToMinutes(draft.jamMasuk || "09:00") + Number(draft.toleransi || 0);
              const h = Math.floor(total / 60) % 24;
              const m = total % 60;
              return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
            })()}
          </span>
          .
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-semibold text-sm transition-transform active:scale-95 disabled:opacity-70"
        style={{ background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : saved ? (
          <>
            <Check size={16} /> Tersimpan
          </>
        ) : (
          "Simpan"
        )}
      </button>
    </div>
  );
}
