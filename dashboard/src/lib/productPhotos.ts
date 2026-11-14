import type { ShopTypeId } from '../types'

function hashSeed(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

const u = (id: string) => `https://images.unsplash.com/${id}?w=720&h=420&fit=crop&q=80`

/** Category defaults — never mix soda onto garments. */
const BY_CATEGORY: Record<ShopTypeId, string[]> = {
  kirana: [
    u('photo-1586201375761-83865001e31c'), // rice
    u('photo-1474979266404-7eaacbcd87c5'), // oil
    u('photo-1621939514649-280e2ee25f60'), // snacks
    u('photo-1563636619-e9143da7973b'), // milk
    u('photo-1610557892470-55d9e80c0bce'), // detergent
    u('photo-1604719312566-8912e9227c6a'), // shelf
  ],
  garments: [
    u('photo-1519238263530-99bdd11df2ea'), // kids clothes
    u('photo-1596755094514-f87e34085b85'), // shirts
    u('photo-1542272604-787c3835535d'), // jeans
    u('photo-1434389677669-e08b4cac3105'), // knit / ethnic vibe
    u('photo-1523381210434-271e8be1f52b'), // tees folded
    u('photo-1558171813-4c088753af8f'), // fashion rail
  ],
  pharma: [
    u('photo-1584308666744-24d5c474f2ae'), // pills
    u('photo-1587854692152-cbe660dbde88'), // medicine
    u('photo-1471862381857-e5e3b4a9c1d0'), // pharmacy
    u('photo-1631549916768-4119b2e5f926'), // bottles
  ],
  electronics: [
    u('photo-1625842268584-8f3296236761'), // cables/gadgets
    u('photo-1609091839311-b5b6fdc1b8b7'), // power bank vibe
    u('photo-1505740420928-5e560c06d30e'), // headphones
    u('photo-1511707171634-5f897ff02aa9'), // phone
  ],
  food: [
    u('photo-1546069901-ba9599a7e63c'), // meal
    u('photo-1629203851122-3726ecdf080e'), // soda
    u('photo-1621939514649-280e2ee25f60'), // snacks
    u('photo-1488477181946-6428a0291777'), // dessert
  ],
  beauty: [
    u('photo-1596462502278-27bfdc403348'), // makeup
    u('photo-1522335789203-aabd1fc54bc9'), // beauty
    u('photo-1571875257727-256c39da42af'), // skincare
    u('photo-1598440947619-2c35fc9aa908'), // cosmetics
  ],
  stationery: [
    u('photo-1456513080080-2f2d2d0c6f8a'), // notebooks
    u('photo-1583485088034-697b5bc36b2d'), // pens
    u('photo-1513364776144-60967b0f800f'), // art
    u('photo-1503676260728-1c00da094a0b'), // school
  ],
}

/** Keyword overrides inside a category (and safe cross-category food/drink only for kirana/food). */
const KEYWORD_MAP: { test: RegExp; url: string; cats?: ShopTypeId[] }[] = [
  { test: /kids|child|infant|2.?4|wear|frock/, url: u('photo-1519238263530-99bdd11df2ea'), cats: ['garments'] },
  { test: /shirt|formal|cotton tee|tee/, url: u('photo-1596755094514-f87e34085b85'), cats: ['garments'] },
  { test: /jean|denim/, url: u('photo-1542272604-787c3835535d'), cats: ['garments'] },
  { test: /kurta|ethnic|dupatta|saree/, url: u('photo-1610030469983-98e550d6193c'), cats: ['garments'] },
  { test: /oil|fortune/, url: u('photo-1474979266404-7eaacbcd87c5'), cats: ['kirana', 'food', 'beauty'] },
  { test: /maggi|noodle|snack|atta/, url: u('photo-1621939514649-280e2ee25f60'), cats: ['kirana', 'food'] },
  { test: /milk|amul|dairy|curd/, url: u('photo-1563636619-e9143da7973b'), cats: ['kirana', 'food'] },
  { test: /thums|drink|cola|pepsi|sprite|cold drink/, url: u('photo-1629203851122-3726ecdf080e'), cats: ['kirana', 'food'] },
  { test: /detergent|soap/, url: u('photo-1610557892470-55d9e80c0bce'), cats: ['kirana'] },
  { test: /rice|dal|pulse/, url: u('photo-1586201375761-83865001e31c'), cats: ['kirana'] },
  { test: /cable|type.?c|usb/, url: u('photo-1625842268584-8f3296236761'), cats: ['electronics'] },
  { test: /earphone|headphone|bud/, url: u('photo-1505740420928-5e560c06d30e'), cats: ['electronics'] },
  { test: /power bank|battery/, url: u('photo-1609091839311-b5b6fdc1b8b7'), cats: ['electronics'] },
  { test: /phone case|case/, url: u('photo-1511707171634-5f897ff02aa9'), cats: ['electronics'] },
  { test: /paracetamol|syrup|ors|vitamin|pill/, url: u('photo-1584308666744-24d5c474f2ae'), cats: ['pharma'] },
  { test: /notebook|pen|geometry|exam|drawing|art/, url: u('photo-1456513080080-2f2d2d0c6f8a'), cats: ['stationery'] },
  { test: /face wash|sunscreen|lip|nail|perfume|hair/, url: u('photo-1596462502278-27bfdc403348'), cats: ['beauty'] },
]

export function productImage(sku: string, shopTypeId: ShopTypeId = 'kirana'): string {
  const s = sku.toLowerCase()
  for (const row of KEYWORD_MAP) {
    if (!row.test.test(s)) continue
    if (row.cats && !row.cats.includes(shopTypeId)) continue
    return row.url
  }
  const pool = BY_CATEGORY[shopTypeId] || BY_CATEGORY.kirana
  return pool[hashSeed(`${shopTypeId}:${sku}`) % pool.length]
}

export function shopImage(name: string, shopTypeId: ShopTypeId = 'kirana'): string {
  const pool = BY_CATEGORY[shopTypeId] || BY_CATEGORY.kirana
  // Prefer storefront-ish last images where available; still category-safe
  return pool[hashSeed(name) % pool.length]
}
