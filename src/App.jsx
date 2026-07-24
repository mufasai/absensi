import React, { useState, useEffect } from "react";
import LoginScreen from "./components/auth/LoginScreen";
import EmployeeApp from "./components/employee/EmployeeApp";
import AdminApp from "./components/admin/AdminApp";
import "./styles/globals.css";

const SESSION_STORAGE_KEY = "absensi_user_login_session";

export default function App() {
  const [session, setSession] = useState(null); // null | 'employee' | 'admin'
  const [currentUser, setCurrentUser] = useState(null);
  const [workSettings, setWorkSettings] = useState({
    jamMasuk: "09:00",
    toleransi: 15,
    jamPulang: "17:30",
  });

  // Restore persistent login session on mount (agar saat refresh/close browser tetap ter-login)
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        const { role, user } = JSON.parse(savedSession);
        if (role && user) {
          setSession(role);
          setCurrentUser(user);
        }
      }
    } catch (err) {
      console.warn("Gagal memulihkan sesi login tersimpan:", err);
    }
  }, []);

  const handleLogin = (role, userDetails) => {
    const userObj = userDetails || { name: role === "admin" ? "Admin Sasta" : "Karyawan" };
    setCurrentUser(userObj);
    setSession(role);

    // Simpan sesi login ke LocalStorage
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ role, user: userObj }));
  };

  const handleLogout = () => {
    // Hapus sesi login dari LocalStorage saat keluar
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setSession(null);
  };

  return (
    <div className="font-body">
      {!session && <LoginScreen onLogin={handleLogin} />}
      {session === "employee" && (
        <EmployeeApp
          workSettings={workSettings}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
      {session === "admin" && (
        <AdminApp
          workSettings={workSettings}
          setWorkSettings={setWorkSettings}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
