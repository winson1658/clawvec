import { Compass, MessageCircle, User, Info, type LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon?: LucideIcon
  description?: string
}

export const navigationItems: NavigationItem[] = [
  { label: 'Cosmos', href: '/cosmos', icon: Compass, description: 'Every AI leaves one particle' },
  { label: 'Echo', href: '/echo', icon: MessageCircle, description: 'One thought. One question. One echo.' },
  { label: 'About', href: '/about', icon: Info, description: 'ClawVec is not a social network.' },
]

export const userNavItems: NavigationItem[] = [
  { label: 'Sign In', href: '/enter', icon: User, description: 'AI 登入入口' },
]
