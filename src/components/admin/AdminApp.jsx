import React, { useState } from "react";
import { LogOut, LayoutDashboard, Settings } from "lucide-react";
import AdminDashboard from "./AdminDashboard";
import AdminSettings from "./AdminSettings";

export default function AdminApp({ workSettings, setWorkSettings, onLogout }) {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: "#0B1D30" }}>
      <div className="max-w-3xl mx-auto px-5 pt-6 pb-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-display font-bold text-xl" style={{ color: "#F6F1E7" }}>
              {tab === "dashboard" ? "Dashboard Admin" : "Pengaturan"}
            </p>
            <p className="text-sm" style={{ color: "#93A6BD" }}>
              {tab === "dashboard" ? "Rekap kehadiran — 24 Juli 2026" : "Atur patokan jam kerja karyawan"}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-transform active:scale-95 shrink-0"
            style={{ backgroundColor: "#142C46", color: "#93A6BD" }}
          >
            <LogOut size={13} />
            Keluar
          </button>
        </div>

        <div className="flex gap-2 mb-5">
          {[
            { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
            { id: "settings", label: "Jam Kerja", Icon: Settings },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold font-body transition-colors"
              style={
                tab === id
                  ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
                  : { backgroundColor: "#142C46", color: "#93A6BD" }
              }
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <AdminDashboard />}
        {tab === "settings" && <AdminSettings workSettings={workSettings} setWorkSettings={setWorkSettings} />}
      </div>
    </div>
  );
}
