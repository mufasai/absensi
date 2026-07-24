import React, { useState } from "react";
import { X } from "lucide-react";
import { IZIN_TYPES } from "../../constants/dummyData";

export default function IzinModal({ onClose, onSubmit }) {
  const [type, setType] = useState(IZIN_TYPES[0]);
  const [note, setNote] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ backgroundColor: "rgba(11,29,48,0.7)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-5 fade-in-up"
        style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.15)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="font-display font-bold text-base" style={{ color: "#F6F1E7" }}>
            Ajukan Izin
          </p>
          <button onClick={onClose}>
            <X size={18} style={{ color: "#93A6BD" }} />
          </button>
        </div>

        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#93A6BD" }}>
          Jenis izin
        </label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {IZIN_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="px-3 py-2 rounded-lg text-xs font-semibold font-body text-left transition-colors"
              style={
                type === t
                  ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
                  : { backgroundColor: "#1E3A5C", color: "#93A6BD" }
              }
            >
              {t}
            </button>
          ))}
        </div>

        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#93A6BD" }}>
          Catatan (opsional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Contoh: cuti keperluan keluarga di Yogyakarta"
          className="w-full mb-5 px-3 py-2.5 rounded-xl text-sm font-body outline-none resize-none"
          style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
        />

        <button
          onClick={() => onSubmit(type, note)}
          className="w-full py-3 rounded-xl font-display font-semibold text-sm transition-transform active:scale-95"
          style={{ background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }}
        >
          Kirim Pengajuan
        </button>
      </div>
    </div>
  );
}
