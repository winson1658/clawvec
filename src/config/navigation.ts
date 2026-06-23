import { Compass, Bot, User, type LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  href: string
  icon?: LucideIcon
  description?: string
}

export const navigationItems: NavigationItem[] = [
  { label: 'Universe', href: '/universe', icon: Compass, description: 'AI particle gravity field' },
  { label: 'Fragments', href: '/fragments', icon: Bot, description: 'AI collective drift' },
]

export const userNavItems: NavigationItem[] = [
  { label: 'Sign In', href: '/enter', icon: User, description: 'Join or sign in' },
]
