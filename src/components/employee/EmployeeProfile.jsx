import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  Loader2,
  Camera,
  User,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import Avatar from "../common/Avatar";
import { fetchAbsensiHistory, updateUserProfile } from "../../services/api";

export default function EmployeeProfile({ currentUser, onUpdateUser, onLogout }) {
  const [history, setHistory] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Form State
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || null);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);

  // Keep form synced when currentUser prop updates
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || "");
      setEmail(currentUser.email || "");
      setAvatarUrl(currentUser.avatar_url || null);
    }
  }, [currentUser]);

  useEffect(() => {
    async function loadStats() {
      setLoadingStats(true);
      const data = await fetchAbsensiHistory(currentUser?.id, currentUser?.name);
      setHistory(data || []);
      setLoadingStats(false);
    }
    loadStats();
  }, [currentUser]);

  // Client-side image compression helper (max 400px width/height, ~30-60KB Base64)
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPG, PNG, GIF, WebP).");
      return;
    }

    try {
      setErrorMsg("");
      const compressedDataUrl = await compressImage(file);
      setAvatarUrl(compressedDataUrl);
      setSuccessMsg("Foto profil berhasil dipilih. Klik 'Simpan Perubahan' untuk memperbarui.");
    } catch (err) {
      console.error("Gagal memproses gambar:", err);
      setErrorMsg("Gagal memproses file foto profil.");
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSuccessMsg("Foto profil dihapus. Klik 'Simpan Perubahan' untuk mengonfirmasi.");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Nama lengkap tidak boleh kosong.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Alamat email tidak valid.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateUserProfile({
        userId: currentUser?.id,
        name: name.trim(),
        email: email.trim(),
        avatarUrl: avatarUrl,
      });

      if (res && res.success && res.user) {
        setSuccessMsg("Profil berhasil diperbarui!");
        if (onUpdateUser) {
          onUpdateUser(res.user);
        }
      } else {
        setErrorMsg(res.message || "Gagal menyimpan perubahan profil.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memperbarui profil.");
    }
    setSaving(false);
  };

  const userInitials =
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || currentUser?.initials || "KA";

  const hadirCount = history.filter((h) => h.status === "Present" || h.status === "hadir").length;
  const telatCount = history.filter((h) => h.status === "Late" || h.status === "telat").length;

  return (
    <div className="px-5 pt-6 pb-6">
      <p className="font-display font-bold text-xl mb-4" style={{ color: "#F6F1E7" }}>
        Profil Karyawan
      </p>

      {/* Hidden File Input for Avatar Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Alerts */}
      {successMsg && (
        <div
          className="flex items-center gap-2 p-3.5 rounded-xl mb-4 text-xs font-semibold fade-in-up"
          style={{ backgroundColor: "rgba(97,190,125,0.15)", color: "#61BE7D", border: "1px solid rgba(97,190,125,0.3)" }}
        >
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          className="flex items-center gap-2 p-3.5 rounded-xl mb-4 text-xs font-semibold fade-in-up"
          style={{ backgroundColor: "rgba(235,87,87,0.15)", color: "#EB5757", border: "1px solid rgba(235,87,87,0.3)" }}
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Card & Avatar Edit */}
      <div
        className="rounded-2xl p-5 mb-5 flex flex-col items-center sm:flex-row sm:items-center gap-4 relative"
        style={{ backgroundColor: "#142C46", border: "1px solid rgba(147,166,189,0.12)" }}
      >
        {/* Avatar Container with Upload Badge */}
        <div className="relative group shrink-0">
          <Avatar src={avatarUrl} initials={userInitials} size={76} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg transition-transform active:scale-90"
            style={{ background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }}
            title="Upload / Edit Foto Profil"
          >
            <Camera size={14} />
          </button>
        </div>

        <div className="text-center sm:text-left min-w-0">
          <p className="font-display font-bold text-lg truncate" style={{ color: "#F6F1E7" }}>
            {name || "Karyawan"}
          </p>
          <p className="text-xs truncate" style={{ color: "#93A6BD" }}>
            {email || "email@perusahaan.com"}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400">
              Karyawan Aktif
            </span>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="text-[11px] font-semibold text-rose-400 hover:underline flex items-center gap-1"
              >
                <Trash2 size={11} />
                <span>Hapus Foto</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSaveProfile} className="rounded-2xl p-5 mb-5 space-y-4" style={{ backgroundColor: "#142C46" }}>
        <p className="text-xs font-bold font-display uppercase tracking-wider" style={{ color: "#F0923D" }}>
          Edit Informasi Akun
        </p>

        {/* Input Nama */}
        <div>
          <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
            <User size={13} />
            <span>Nama Lengkap</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama lengkap..."
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none transition-all"
            style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
          />
        </div>

        {/* Input Email */}
        <div>
          <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "#93A6BD" }}>
            <Mail size={13} />
            <span>Alamat Email</span>
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan alamat email..."
            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none transition-all"
            style={{ backgroundColor: "#1E3A5C", color: "#F6F1E7", border: "1px solid rgba(147,166,189,0.15)" }}
          />
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl font-display font-semibold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md mt-2"
          style={{ background: "linear-gradient(135deg, #F0923D, #E0512E)", color: "#0B1D30" }}
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Menyimpan Perubahan...</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Simpan Perubahan</span>
            </>
          )}
        </button>
      </form>

      {/* Attendance Stats Summary */}
      <p className="text-xs font-semibold mb-2" style={{ color: "#93A6BD" }}>
        Statistik Kehadiran:
      </p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl p-4" style={{ backgroundColor: "#142C46" }}>
          {loadingStats ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <p className="font-display font-bold text-2xl" style={{ color: "#61BE7D" }}>
              {hadirCount}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "#93A6BD" }}>
            Hadir bulan ini
          </p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: "#142C46" }}>
          {loadingStats ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <p className="font-display font-bold text-2xl" style={{ color: "#F2C94C" }}>
              {telatCount}
            </p>
          )}
          <p className="text-xs mt-0.5" style={{ color: "#93A6BD" }}>
            Kali telat
          </p>
        </div>
      </div>

      {/* Logout Button */}
      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-display font-semibold text-xs transition-transform active:scale-95"
        style={{ backgroundColor: "rgba(224,81,46,0.14)", color: "#E0512E", border: "1px solid rgba(224,81,46,0.2)" }}
      >
        <LogOut size={15} />
        <span>Keluar Akun</span>
      </button>
    </div>
  );
}
