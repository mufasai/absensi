import { CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";

export const EMPLOYEE = {
  name: "Dimas Prayoga",
  role: "Frontend Engineer",
  id: "EMP-2291",
  initials: "DP",
};

export const IZIN_TYPES = [
  "Cuti Tahunan",
  "Sakit",
  "Izin Pribadi",
  "Dinas Luar Kota",
  "Lainnya",
];

export const STATUS_META = {
  hadir: { label: "Tepat Waktu", color: "#45B787", bg: "rgba(69,183,135,0.14)", Icon: CheckCircle2 },
  telat: { label: "Telat", color: "#F2B705", bg: "rgba(242,183,5,0.14)", Icon: AlertCircle },
  izin: { label: "Izin", color: "#93A6BD", bg: "rgba(147,166,189,0.14)", Icon: AlertCircle },
  alpha: { label: "Tidak Hadir", color: "#E0512E", bg: "rgba(224,81,46,0.14)", Icon: XCircle },
  belum_absen: { label: "Belum Hadir", color: "#93A6BD", bg: "rgba(147,166,189,0.14)", Icon: Clock },
};

export const INITIAL_HISTORY = [
  { date: "24 Jul 2026", in: "08:52", out: "17:41", status: "hadir", duration: "8j 49m", location: "Kantor Pusat, Jakarta Selatan", keterangan: null },
  { date: "23 Jul 2026", in: "09:14", out: "17:30", status: "telat", duration: "8j 16m", location: "Kantor Pusat, Jakarta Selatan", keterangan: null },
  { date: "22 Jul 2026", in: "08:47", out: "17:38", status: "hadir", duration: "8j 51m", location: "Kantor Pusat, Jakarta Selatan", keterangan: null },
  { date: "21 Jul 2026", in: "—", out: "—", status: "izin", duration: "—", location: null, keterangan: "Cuti Tahunan" },
  { date: "20 Jul 2026", in: "08:55", out: "17:33", status: "hadir", duration: "8j 38m", location: "Kantor Pusat, Jakarta Selatan", keterangan: null },
  { date: "19 Jul 2026", in: "09:22", out: "17:29", status: "telat", duration: "8j 07m", location: "Kantor Pusat, Jakarta Selatan", keterangan: null },
  { date: "18 Jul 2026", in: "—", out: "—", status: "alpha", duration: "—", location: null, keterangan: "Tanpa Keterangan" },
];

export const TEAM = [
  { name: "Dimas Prayoga", in: "08:52", status: "hadir", location: "Kantor Pusat, Jakarta Selatan" },
  { name: "Rani Kusuma", in: "08:41", status: "hadir", location: "Kantor Pusat, Jakarta Selatan" },
  { name: "Yusuf Hakim", in: "09:18", status: "telat", location: "Kantor Pusat, Jakarta Selatan" },
  { name: "Wulan Sari", in: "—", status: "izin", location: null, keterangan: "Sakit" },
  { name: "Andra Wijaya", in: "08:49", status: "hadir", location: "WFH — Bekasi" },
  { name: "Citra Ayu", in: "—", status: "belum_absen", location: null, keterangan: "Belum Hadir" },
  { name: "Fajar Nugroho", in: "08:58", status: "hadir", location: "Kantor Pusat, Jakarta Selatan" },
  { name: "Made Surya", in: "09:31", status: "telat", location: "WFH — Jakarta Timur" },
];
