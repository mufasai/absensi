/**
 * Service untuk menangani Izin Geolocation Browser & Reverse Geocoding (Konversi Lat/Lng ke Nama Jalan)
 */

// Meminta izin lokasi otomatis dari peramban saat dimuat
export function requestLocationPermission() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ granted: false, reason: "Browser tidak mendukung Geolocation" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          granted: true,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.warn("Geolocation permission error/denied:", error);
        resolve({ granted: false, reason: error.message });
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  });
}

/**
 * Mengubah koordinat (lat, lng) menjadi Nama Jalan & Alamat Lengkap
 * Menggunakan OpenStreetMap Nominatim API (Free Reverse Geocoding)
 */
export async function getStreetAddress(lat, lng) {
  if (!lat || !lng) return "Lokasi tidak terdeteksi";

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`;
    const response = await fetch(url, {
      headers: {
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        "User-Agent": "AbsensiApp/1.0",
      },
    });

    if (!response.ok) {
      throw new Error("Reverse geocoding request failed");
    }

    const data = await response.json();
    if (data && data.address) {
      const road = data.address.road || data.address.pedestrian || data.address.suburb || "";
      const city = data.address.city || data.address.town || data.address.city_district || data.address.county || "";
      const state = data.address.state || "";

      if (road && city) {
        return `${road}, ${city}`;
      } else if (data.display_name) {
        const parts = data.display_name.split(",");
        return parts.slice(0, 3).join(",").trim();
      }
    }
  } catch (error) {
    console.warn("Reverse geocoding error:", error);
  }

  // Fallback format jika API reverse geocode offline/error
  return `Koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}
