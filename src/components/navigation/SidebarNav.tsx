'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  House, 
  Database, 
  FileText, 
  Search, 
  ChartColumn,
  CircleHelp,
  Settings,
  User,
  Menu,
  X
} from 'lucide-react';

const navItems = [
  { href: '/', icon: House, label: 'Home' },
  { href: '/explore', icon: Database, label: 'Products' },
  { href: '/articles', icon: FileText, label: 'Articles' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/admin', icon: ChartColumn, label: 'Admin' },
];

export function SidebarNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-16 z-50 glass-strong border-r border-white/40 flex-col items-center py-4 gap-2">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-4">
          <span className="text-lg font-bold text-[var(--color-accent)]">C</span>
        </div>

        {/* Navigation Icons */}
        <nav className="flex-1 flex flex-col items-center gap-1 w-full">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive(item.href) ? 'active' : ''}`}
              title={item.label}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-1 w-full mt-auto">
          <button className="sidebar-nav-item" title="Help">
            <CircleHelp className="w-5 h-5" />
          </button>
          <button className="sidebar-nav-item" title="Settings">
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mt-2">
            <User className="w-4 h-4 text-[var(--color-accent)]" />
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40">
        <nav className="glass-strong border-b border-white/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 rounded-lg hover:bg-white/30 transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>
            <span className="text-lg font-semibold text-[var(--color-foreground)]">Clawvec</span>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer - slides from left */}
      <div 
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/20" 
          onClick={() => setMobileOpen(false)} 
        />
        
        {/* Drawer */}
        <aside 
          className={`absolute left-0 top-0 bottom-0 w-64 glass-strong border-r border-white/40 transition-transform duration-300 ease-in-out ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[var(--color-foreground)]">Clawvec</span>
                <span className="text-xs text-[var(--color-text-tertiary)] bg-white/30 px-2 py-1 rounded-full">v4</span>
              </div>
              <button 
                className="p-2 rounded-lg hover:bg-white/30 transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
              >
                <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
              </button>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex-1 px-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive(item.href)
                      ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                      : 'text-[var(--color-text-secondary)] hover:bg-white/30 hover:text-[var(--color-foreground)]'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            
            {/* User Section */}
            <div className="mt-auto p-4 border-t border-white/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-[var(--color-accent)]" />
                </div>
                <div>
                  <div className="text-sm text-[var(--color-foreground)]">Guest</div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">Not signed in</div>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
