import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  FileText,
  Coffee,
  HeartPulse,
  Home,
  Briefcase,
} from "lucide-react";

export const EMPLOYEE = {
  name: "Dimas Prayoga",
  role: "Frontend Engineer",
  id: "EMP-2291",
  initials: "DP",
};

export const IZIN_TYPES = [
  "Cuti Tahunan",
  "Sakit",
  "Work From Anywhere/Home",
  "Out of Office (Work)",
];

export const STATUS_META = {
  // 1. Present
  present: { label: "Present", color: "#61BE7D", bg: "rgba(97, 190, 125, 0.18)", Icon: CheckCircle2 },
  hadir: { label: "Present", color: "#61BE7D", bg: "rgba(97, 190, 125, 0.18)", Icon: CheckCircle2 },
  Present: { label: "Present", color: "#61BE7D", bg: "rgba(97, 190, 125, 0.18)", Icon: CheckCircle2 },

  // 2. Late
  late: { label: "Late", color: "#F2C94C", bg: "rgba(242, 201, 76, 0.18)", Icon: AlertCircle },
  telat: { label: "Late", color: "#F2C94C", bg: "rgba(242, 201, 76, 0.18)", Icon: AlertCircle },
  Late: { label: "Late", color: "#F2C94C", bg: "rgba(242, 201, 76, 0.18)", Icon: AlertCircle },

  // 3. Excused absence (1 Day) / Cuti
  "Cuti Tahunan": { label: "Excused absence (1 Day)", color: "#56CCF2", bg: "rgba(86, 204, 242, 0.18)", Icon: FileText },
  excused_1day: { label: "Excused absence (1 Day)", color: "#56CCF2", bg: "rgba(86, 204, 242, 0.18)", Icon: FileText },
  "Excused absence (1 Day)": { label: "Excused absence (1 Day)", color: "#56CCF2", bg: "rgba(86, 204, 242, 0.18)", Icon: FileText },
  izin: { label: "Excused absence (1 Day)", color: "#56CCF2", bg: "rgba(86, 204, 242, 0.18)", Icon: FileText },

  // 4. Excused absence (Half Day)
  excused_halfday: { label: "Excused absence (Half Day)", color: "#9B51E0", bg: "rgba(155, 81, 224, 0.18)", Icon: Clock },
  "Excused absence (Half Day)": { label: "Excused absence (Half Day)", color: "#9B51E0", bg: "rgba(155, 81, 224, 0.18)", Icon: Clock },

  // 5. Unexcused absence
  unexcused: { label: "Unexcused absence", color: "#EB5757", bg: "rgba(235, 87, 87, 0.18)", Icon: XCircle },
  "Unexcused absence": { label: "Unexcused absence", color: "#EB5757", bg: "rgba(235, 87, 87, 0.18)", Icon: XCircle },
  alpha: { label: "Unexcused absence", color: "#EB5757", bg: "rgba(235, 87, 87, 0.18)", Icon: XCircle },

  // 6. Day Off
  day_off: { label: "Day Off", color: "#A8DADC", bg: "rgba(168, 218, 220, 0.18)", Icon: Coffee },
  "Day Off": { label: "Day Off", color: "#A8DADC", bg: "rgba(168, 218, 220, 0.18)", Icon: Coffee },

  // 7. Sick / Sakit
  Sakit: { label: "Sick", color: "#F2994A", bg: "rgba(242, 153, 74, 0.18)", Icon: HeartPulse },
  sick: { label: "Sick", color: "#F2994A", bg: "rgba(242, 153, 74, 0.18)", Icon: HeartPulse },
  "Sick": { label: "Sick", color: "#F2994A", bg: "rgba(242, 153, 74, 0.18)", Icon: HeartPulse },
  sakit: { label: "Sick", color: "#F2994A", bg: "rgba(242, 153, 74, 0.18)", Icon: HeartPulse },

  // 8. Work From Anywhere/Home
  "Work From Anywhere/Home": { label: "Work From Anywhere/Home", color: "#BB6BD9", bg: "rgba(187, 107, 217, 0.18)", Icon: Home },
  wfh: { label: "Work From Anywhere/Home", color: "#BB6BD9", bg: "rgba(187, 107, 217, 0.18)", Icon: Home },

  // 9. Out of Office (Work)
  "Out of Office (Work)": { label: "Out of Office (Work)", color: "#E07A5F", bg: "rgba(224, 122, 95, 0.18)", Icon: Briefcase },
  out_of_office: { label: "Out of Office (Work)", color: "#E07A5F", bg: "rgba(224, 122, 95, 0.18)", Icon: Briefcase },

  // 10. Default Belum Hadir
  belum_absen: { label: "Belum Hadir", color: "#93A6BD", bg: "rgba(147, 166, 189, 0.14)", Icon: Clock },
};

export const APPROVAL_STATUS_META = {
  pending: { label: "Menunggu Persetujuan", color: "#F2C94C", bg: "rgba(242, 201, 76, 0.18)" },
  approved: { label: "Disetujui", color: "#61BE7D", bg: "rgba(97, 190, 125, 0.18)" },
  declined: { label: "Ditolak", color: "#EB5757", bg: "rgba(235, 87, 87, 0.18)" },
};

export const INITIAL_HISTORY = [
  { date: "24 Jul 2026", in: "08:52", out: "17:41", status: "Present", duration: "8j 49m", location: "Kantor Pusat, Jakarta Selatan", keterangan: null },
  { date: "23 Jul 2026", in: "09:14", out: "17:30", status: "Late", duration: "8j 16m", location: "Kantor Pusat, Jakarta Selatan", keterangan: null },
  { date: "22 Jul 2026", in: "08:47", out: "17:38", status: "Present", duration: "8j 51m", location: "Kantor Pusat, Jakarta Selatan", keterangan: null },
  { date: "21 Jul 2026", in: "—", out: "—", status: "Cuti Tahunan", duration: "—", location: null, keterangan: "Cuti Tahunan", approval_status: "approved" },
];

export const TEAM = [
  { name: "Dimas Prayoga", in: "08:52", status: "Present", location: "Kantor Pusat, Jakarta Selatan" },
  { name: "Rani Kusuma", in: "08:41", status: "Present", location: "Kantor Pusat, Jakarta Selatan" },
  { name: "Yusuf Hakim", in: "09:18", status: "Late", location: "Kantor Pusat, Jakarta Selatan" },
  { name: "Wulan Sari", in: "—", status: "Sakit", location: null, keterangan: "Sakit" },
  { name: "Andra Wijaya", in: "08:49", status: "Work From Anywhere/Home", location: "WFH — Bekasi" },
  { name: "Citra Ayu", in: "—", status: "belum_absen", location: null, keterangan: "Belum Hadir" },
];
