import type { ShopTypeId } from '../types'

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function ShopIcon({ id, size = 28 }: { id: ShopTypeId; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 32 32',
    'aria-hidden': true as const,
  }

  switch (id) {
    case 'kirana':
      return (
        <svg {...common}>
          <path {...stroke} d="M6 12h20l-1.5 14H7.5L6 12Z" />
          <path {...stroke} d="M11 12V9a5 5 0 0 1 10 0v3" />
          <path {...stroke} d="M12 18h8" />
        </svg>
      )
    case 'garments':
      return (
        <svg {...common}>
          <path {...stroke} d="M11 6l5 3 5-3 4 4-4 2v13H11V12L7 10l4-4Z" />
          <path {...stroke} d="M13 9.5c1 .8 5 .8 6 0" />
        </svg>
      )
    case 'pharma':
      return (
        <svg {...common}>
          <rect {...stroke} x="7" y="5" width="18" height="22" rx="4" />
          <path {...stroke} d="M16 11v10M11 16h10" />
        </svg>
      )
    case 'electronics':
      return (
        <svg {...common}>
          <rect {...stroke} x="9" y="4" width="14" height="24" rx="3" />
          <path {...stroke} d="M14 25h4" />
          <path {...stroke} d="M12 9h8M12 13h8M12 17h5" />
        </svg>
      )
    case 'food':
      return (
        <svg {...common}>
          <path {...stroke} d="M8 14c0-4 3.5-7 8-7s8 3 8 7v10H8V14Z" />
          <path {...stroke} d="M11 14h10" />
          <path {...stroke} d="M12 8.5c1-1.5 7-1.5 8 0" />
          <path {...stroke} d="M14 24v3M18 24v3" />
        </svg>
      )
    case 'beauty':
      return (
        <svg {...common}>
          <path {...stroke} d="M12 4h8l-1 8H13L12 4Z" />
          <path {...stroke} d="M13 12h6v11a3 3 0 0 1-6 0V12Z" />
          <path {...stroke} d="M14 7h4" />
        </svg>
      )
    case 'stationery':
      return (
        <svg {...common}>
          <path {...stroke} d="M8 5h12l4 4v18H8V5Z" />
          <path {...stroke} d="M20 5v4h4" />
          <path {...stroke} d="M12 14h8M12 18h8M12 22h5" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle {...stroke} cx="16" cy="16" r="10" />
        </svg>
      )
  }
}
