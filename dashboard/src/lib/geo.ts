import type { GeoPoint, PlaceInfo } from '../types'

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

/** Snap GPS to ~110 m grid so the same street always hashes the same. */
export function snapPoint(point: GeoPoint, decimals = 3): GeoPoint {
  const f = 10 ** decimals
  return {
    lat: Math.round(point.lat * f) / f,
    lng: Math.round(point.lng * f) / f,
  }
}

/** Stable cache / seed key for a shop pin. */
export function locationKey(point: GeoPoint, salt = ''): string {
  const p = snapPoint(point)
  return `${p.lat.toFixed(3)}:${p.lng.toFixed(3)}${salt ? `:${salt}` : ''}`
}

export function seedFromPoint(point: GeoPoint, salt = ''): number {
  const raw = locationKey(point, salt)
  let h = 2166136261
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

export function mulberry32(seed: number) {
  let t = Math.floor(seed * 1e9) || 1
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export async function getCurrentPosition(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}

export async function reverseGeocode(point: GeoPoint): Promise<PlaceInfo> {
  // Known demo pin — instant label for hackathon reliability
  if (Math.abs(point.lat - 17.4948) < 0.001 && Math.abs(point.lng - 78.3996) < 0.001) {
    return {
      label: 'KPHB Colony, Kukatpally, Hyderabad',
      neighbourhood: 'KPHB Colony',
      city: 'Hyderabad',
      state: 'Telangana',
    }
  }

  try {
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 5000)
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}&zoom=16&addressdetails=1`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
    window.clearTimeout(timer)
    if (!res.ok) throw new Error('geocode failed')
    const data = await res.json()
    const a = data.address || {}
    const neighbourhood =
      a.suburb || a.neighbourhood || a.residential || a.village || a.town || 'Your area'
    const city = a.city || a.town || a.county || a.state_district || 'Nearby city'
    const state = a.state || ''
    return {
      label: data.display_name?.split(',').slice(0, 3).join(',') || neighbourhood,
      neighbourhood,
      city,
      state,
    }
  } catch {
    return {
      label: `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`,
      neighbourhood: 'Your locality',
      city: 'Your city',
      state: '',
    }
  }
}

/** Offset a point by metres roughly north/east */
export function offsetPoint(origin: GeoPoint, northM: number, eastM: number): GeoPoint {
  const dLat = northM / 111320
  const dLng = eastM / (111320 * Math.cos((origin.lat * Math.PI) / 180))
  return { lat: origin.lat + dLat, lng: origin.lng + dLng }
}
