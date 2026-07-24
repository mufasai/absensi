/**
 * Mengonversi string waktu 'HH:mm' ke total menit dari 00:00
 * Contoh: "08:30" => 510
 */
export function timeStrToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
