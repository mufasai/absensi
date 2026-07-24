import React, { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { loginUser, registerUser } from "../../services/api";

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState("login"); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state (Default role: employee)
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Feedback states
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const clearFeedback = () => {
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSwitchMode = (targetMode) => {
    clearFeedback();
    setMode(targetMode);
  };

  // Dynamic Login Handler (Backend API Verification)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg("Harap isi email dan kata sandi Anda.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser(loginEmail.trim(), loginPassword);
      setLoading(false);

      if (response && response.success && response.user) {
        onLogin(response.user.role || "employee", response.user);
      } else {
        setErrorMsg("Gagal melakukan autentikasi.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Terjadi kesalahan saat masuk.");
    }
  };

  // Dynamic Register Handler (Backend API Creation)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    clearFeedback();

    if (!regName.trim()) {
      setErrorMsg("Nama lengkap wajib diisi.");
      return;
    }
    if (!regEmail.trim()) {
      setErrorMsg("Email kerja wajib diisi.");
      return;
    }
    if (!regEmail.includes("@")) {
      setErrorMsg("Format email tidak valid.");
      return;
    }
    if (regPassword.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const response = await registerUser(regName.trim(), regEmail.trim(), regPassword);
      setLoading(false);

      if (response && response.success) {
        setSuccessMsg("Pendaftaran akun berhasil! Silakan masuk dengan email & kata sandi Anda.");
        setLoginEmail(regEmail);
        setLoginPassword("");
        setMode("login");
      } else {
        setErrorMsg("Gagal mendaftarkan akun.");
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Terjadi kesalahan saat registrasi.");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 font-body"
      style={{ backgroundColor: "#0B1D30" }}
    >
      <div className="w-full max-w-md">
        {/* Header Branding */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="font-display font-bold text-2xl" style={{ color: "#F6F1E7" }}>
            Absensi
          </h1>
          <p className="text-xs mt-1 text-center" style={{ color: "#93A6BD" }}>
            Sistem presensi karyawan digital modern & praktis
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          className="p-1 rounded-xl flex mb-5"
          style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.12)" }}
        >
          <button
            type="button"
            onClick={() => handleSwitchMode("login")}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold font-display transition-all"
            style={
              mode === "login"
                ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
                : { color: "#93A6BD" }
            }
          >
            Masuk Akun
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode("register")}
            className="flex-1 py-2.5 rounded-lg text-xs font-semibold font-display transition-all"
            style={
              mode === "register"
                ? { background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }
                : { color: "#93A6BD" }
            }
          >
            Daftar Akun
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMsg && (
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-xl mb-4 text-xs font-medium fade-in-up"
            style={{ backgroundColor: "rgba(224,81,46,0.15)", color: "#E0512E", border: "1px solid rgba(224,81,46,0.3)" }}
          >
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-xl mb-4 text-xs font-medium fade-in-up"
            style={{ backgroundColor: "rgba(69,183,135,0.15)", color: "#45B787", border: "1px solid rgba(69,183,135,0.3)" }}
          >
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <div
          className="rounded-2xl p-6 shadow-xl fade-in-up"
          style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.15)" }}
        >
          {mode === "login" ? (
            /* Form Login */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
                  <Mail size={13} /> Email Kerja
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-body outline-none"
                  style={{
                    backgroundColor: "#1E3A5C",
                    color: "#F6F1E7",
                    border: "1px solid rgba(147,166,189,0.15)",
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
                    <Lock size={13} /> Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Fitur reset kata sandi akan dikirim ke email Anda.")}
                    className="text-[11px] hover:underline"
                    style={{ color: "#F0923D" }}
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm font-body outline-none"
                    style={{
                      backgroundColor: "#1E3A5C",
                      color: "#F6F1E7",
                      border: "1px solid rgba(147,166,189,0.15)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 rounded-lg"
                    style={{ color: "#93A6BD" }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Form Register (Default Karyawan) */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
                  <User size={13} /> Nama Lengkap
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Dimas Prayoga"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-body outline-none"
                  style={{
                    backgroundColor: "#1E3A5C",
                    color: "#F6F1E7",
                    border: "1px solid rgba(147,166,189,0.15)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
                  <Mail size={13} /> Email Kerja
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm font-body outline-none"
                  style={{
                    backgroundColor: "#1E3A5C",
                    color: "#F6F1E7",
                    border: "1px solid rgba(147,166,189,0.15)",
                  }}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
                  <Lock size={13} /> Kata Sandi
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm font-body outline-none"
                    style={{
                      backgroundColor: "#1E3A5C",
                      color: "#F6F1E7",
                      border: "1px solid rgba(147,166,189,0.15)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1 rounded-lg"
                    style={{ color: "#93A6BD" }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
                  <Lock size={13} /> Konfirmasi Kata Sandi
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl text-sm font-body outline-none"
                    style={{
                      backgroundColor: "#1E3A5C",
                      color: "#F6F1E7",
                      border: "1px solid rgba(147,166,189,0.15)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 p-1 rounded-lg"
                    style={{ color: "#93A6BD" }}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 rounded-xl font-display font-semibold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md disabled:opacity-70"
                style={{ background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>Daftar</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
