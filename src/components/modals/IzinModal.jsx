import React, { useState } from "react";
import { X, Calendar, AlertCircle } from "lucide-react";
import { IZIN_TYPES } from "../../constants/dummyData";

export default function IzinModal({ onClose, onSubmit }) {
  const getTodayStr = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [type, setType] = useState(IZIN_TYPES[0]);
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [note, setNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleTypeChange = (newType) => {
    setType(newType);
    setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (endDate && endDate < startDate) {
      setErrorMsg("Tanggal selesai tidak boleh sebelum tanggal mulai.");
      return;
    }

    onSubmit(type, note, startDate, endDate || startDate);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ backgroundColor: "rgba(11,29,48,0.75)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 fade-in-up"
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

        {errorMsg && (
          <div
            className="flex items-start gap-2 p-3 rounded-xl mb-4 text-xs font-semibold"
            style={{ backgroundColor: "rgba(235,87,87,0.15)", color: "#EB5757", border: "1px solid rgba(235,87,87,0.3)" }}
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <label className="text-xs font-semibold mb-2 block" style={{ color: "#93A6BD" }}>
          Jenis Izin
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {IZIN_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className="px-3 py-2.5 rounded-lg text-xs font-semibold font-body text-left transition-all truncate"
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

        {/* Date Selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#93A6BD" }}>
              <Calendar size={12} />
              <span>Tanggal Mulai</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (endDate < e.target.value) setEndDate(e.target.value);
                setErrorMsg("");
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-body outline-none"
              style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 flex items-center gap-1" style={{ color: "#93A6BD" }}>
              <Calendar size={12} />
              <span>Tanggal Selesai</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setErrorMsg("");
              }}
              min={startDate}
              className="w-full px-3 py-2 rounded-xl text-xs font-body outline-none"
              style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
            />
          </div>
        </div>

        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "#93A6BD" }}>
          Catatan / Alasan (opsional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Tuliskan keterangan detail pengajuan..."
          className="w-full mb-5 px-3 py-2.5 rounded-xl text-xs font-body outline-none resize-none"
          style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
        />

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl font-display font-semibold text-sm transition-transform active:scale-95 shadow-md"
          style={{ background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }}
        >
          Ajukan Izin
        </button>
      </div>
    </div>
  );
}
