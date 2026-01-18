'use client'

import React from 'react'

type Props = {
  name: 'calendar'|'clock'|'hourglass'|'users'|'teacher'|'certificate'|'book'|'list'|'check'|'gift'|'money'|'timer'
  className?: string
  fg?: string
  bg?: string
}

export default function DuoIcon({ name, className = 'w-4 h-4', fg = '#ec4899', bg = '#fde7f1' }: Props){
  const common: React.SVGProps<SVGSVGElement> = {
    className,
    stroke: fg,
    fill: 'none',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  const soft = { fill: bg as string, stroke: 'none' as const }
  switch (name) {
    case 'calendar':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="3" y="4" width="18" height="18" rx="3" {...soft} />
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <line x1="16" y1="2.5" x2="16" y2="6" />
          <line x1="8" y1="2.5" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="12" r="9" {...soft} />
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      )
    case 'hourglass':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M6 2h12M6 22h12" />
          <path d="M7 2c0 5 5 6 5 10s-5 5-5 10" {...soft} />
          <path d="M17 2c0 5-5 6-5 10s5 5 5 10" />
        </svg>
      )
    case 'users':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" {...soft} />
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'teacher':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M2 7l10-5 10 5-10 5z" {...soft} />
          <path d="M2 7l10-5 10 5-10 5z" />
          <path d="M2 12l10 5 10-5" />
          <path d="M2 17l10 5 10-5" />
        </svg>
      )
    case 'certificate':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="12" cy="8" r="5" {...soft} />
          <circle cx="12" cy="8" r="5" />
          <path d="M8 15l-2 7 6-3 6 3-2-7" />
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" {...soft} />
          <path d="M4 4v15.5A2.5 2.5 0 0 0 6.5 22H20V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z" />
        </svg>
      )
    case 'list':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="3" cy="6" r="1.5" {...soft} />
          <circle cx="3" cy="12" r="1.5" {...soft} />
          <circle cx="3" cy="18" r="1.5" {...soft} />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )
    case 'gift':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="3" y="8" width="18" height="12" rx="2" {...soft} />
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M12 8v12" />
          <path d="M12 8H7.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8Z" />
          <path d="M12 8h4.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8Z" />
        </svg>
      )
    case 'money':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" {...soft} />
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'timer':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M10 2h4" />
          <circle cx="12" cy="13" r="8" {...soft} />
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v5l3 3" />
        </svg>
      )
    default:
      return null
  }
}
