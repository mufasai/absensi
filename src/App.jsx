import React, { useState, useEffect } from "react";
import LoginScreen from "./components/auth/LoginScreen";
import EmployeeApp from "./components/employee/EmployeeApp";
import AdminApp from "./components/admin/AdminApp";
import { fetchWorkSettings } from "./services/api";
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

  // 1. Restore persistent login session on mount
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

  // 2. Fetch real work settings from Neon DB
  useEffect(() => {
    async function loadSettings() {
      const data = await fetchWorkSettings();
      if (data && (data.jamMasuk || data.toleransi)) {
        setWorkSettings(data);
      }
    }
    loadSettings();
  }, []);

  const handleLogin = (role, userDetails) => {
    const userObj = userDetails || { name: role === "admin" ? "Admin Sasta" : "Karyawan" };
    setCurrentUser(userObj);
    setSession(role);

    // Simpan sesi login ke LocalStorage
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ role, user: userObj }));
  };

  const handleLogout = () => {
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
