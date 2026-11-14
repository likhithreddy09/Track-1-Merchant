import { SHOP_TYPES } from '../data/shopTypes'
import type { GeoPoint, PlaceInfo, ShopType } from '../types'

const KEY = 'paytm-neighbourhood-session-v1'

export type MerchantSession = {
  location: GeoPoint
  place: PlaceInfo
  shopType: ShopType
  shopName: string
}

type StoredSession = {
  location: GeoPoint
  place: PlaceInfo
  shopTypeId: string
  shopName: string
}

function isPoint(v: unknown): v is GeoPoint {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as GeoPoint).lat === 'number' &&
    typeof (v as GeoPoint).lng === 'number'
  )
}

function isPlace(v: unknown): v is PlaceInfo {
  return (
    !!v &&
    typeof v === 'object' &&
    typeof (v as PlaceInfo).neighbourhood === 'string' &&
    typeof (v as PlaceInfo).city === 'string'
  )
}

export function loadSession(): MerchantSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as StoredSession
    if (!isPoint(data.location) || !isPlace(data.place) || !data.shopName || !data.shopTypeId) {
      return null
    }
    const shopType = SHOP_TYPES.find((t) => t.id === data.shopTypeId)
    if (!shopType) return null
    return {
      location: data.location,
      place: data.place,
      shopType,
      shopName: String(data.shopName),
    }
  } catch {
    return null
  }
}

export function saveSession(session: MerchantSession) {
  try {
    const payload: StoredSession = {
      location: session.location,
      place: session.place,
      shopTypeId: session.shopType.id,
      shopName: session.shopName,
    }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
