import type { CompetitorShop, ShopType } from '../types'

/** Stable Unsplash shop fronts by category — no API key. */
const SHOP_FRONTS: Record<string, string[]> = {
  kirana: [
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=720&h=420&fit=crop&q=80',
  ],
  garments: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=720&h=420&fit=crop&q=80',
  ],
  pharma: [
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=720&h=420&fit=crop&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=720&h=420&fit=crop&q=80',
  ],
  food: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=720&h=420&fit=crop&q=80',
  ],
  beauty: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=720&h=420&fit=crop&q=80',
  ],
  stationery: [
    'https://images.unsplash.com/photo-1456513080080-2f2d2d0c6f8a?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=720&h=420&fit=crop&q=80',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=720&h=420&fit=crop&q=80',
  ],
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

export function shopFrontPhoto(shop: Pick<CompetitorShop, 'id' | 'category'>, shopType?: ShopType): string {
  const cat = `${shop.category} ${shopType?.id || ''} ${shopType?.label || ''}`.toLowerCase()
  const key =
    shopType?.id ||
    ( /garment|fashion|cloth|tailor|wear/.test(cat)
      ? 'garments'
      : /pharma|chemist|medical|drug/.test(cat)
        ? 'pharma'
        : /electron|mobile|gadget|phone/.test(cat)
          ? 'electronics'
          : /food|restaurant|cafe|tandoor/.test(cat)
            ? 'food'
            : /beauty|salon|cosmetic/.test(cat)
              ? 'beauty'
              : /station|book|pen/.test(cat)
                ? 'stationery'
                : /kira|grocery|mart|bazaar/.test(cat)
                  ? 'kirana'
                  : Object.keys(SHOP_FRONTS).find((k) => cat.includes(k.slice(0, 4))) || 'kirana')
  const pool = SHOP_FRONTS[key] || SHOP_FRONTS.kirana
  return pool[hashId(shop.id) % pool.length]
}
