import React, { useState } from "react";
import { Home, History, User } from "lucide-react";
import EmployeeHome from "./EmployeeHome";
import EmployeeHistory from "./EmployeeHistory";
import EmployeeProfile from "./EmployeeProfile";

export default function EmployeeApp({ currentUser, workSettings, onUpdateUser, onLogout }) {
  const [tab, setTab] = useState("home");

  const tabs = [
    { id: "home", label: "Beranda", Icon: Home },
    { id: "history", label: "Riwayat", Icon: History },
    { id: "profile", label: "Profil", Icon: User },
  ];

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: "#0B1D30" }}>
      <div className="max-w-md mx-auto pb-24">
        {tab === "home" && <EmployeeHome currentUser={currentUser} workSettings={workSettings} />}
        {tab === "history" && <EmployeeHistory currentUser={currentUser} />}
        {tab === "profile" && (
          <EmployeeProfile currentUser={currentUser} onUpdateUser={onUpdateUser} onLogout={onLogout} />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 flex justify-center" style={{ backgroundColor: "#0B1D30" }}>
        <div className="max-w-md w-full flex items-stretch" style={{ borderTop: "1px solid rgba(147,166,189,0.14)" }}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-colors"
              style={{ color: tab === id ? "#F0923D" : "#93A6BD" }}
            >
              <Icon size={20} strokeWidth={tab === id ? 2.4 : 2} />
              <span className="text-[11px] font-semibold font-body">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
