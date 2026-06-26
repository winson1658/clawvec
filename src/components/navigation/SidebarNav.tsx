'use client';

import { createContext, useContext, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  House, 
  Compass, 
  Bot,
  CircleHelp,
  Settings,
  User,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/', icon: House, label: 'Home' },
  { href: '/cosmos', icon: Compass, label: 'Cosmos' },
  { href: '/echo', icon: Bot, label: 'Echo' },
];

const SidebarContext = createContext<{
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}>({ expanded: false, setExpanded: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <SidebarContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const { expanded, setExpanded } = useSidebar();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Desktop Sidebar - Collapsible */}
      <aside 
        className={`hidden md:flex fixed left-0 top-0 bottom-0 z-50 glass-strong border-r border-white/40 flex-col py-4 gap-2 transition-all duration-300 ease-in-out ${
          expanded ? 'w-64 items-stretch px-4' : 'w-16 items-center'
        }`}
      >
        {/* Logo */}
        <div className={`flex items-center mb-4 ${expanded ? 'gap-3 px-2' : 'justify-center'}`}>
          <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-[var(--color-accent)]">C</span>
          </div>
          {expanded && (
            <span className="text-xl font-bold text-[var(--color-foreground)] whitespace-nowrap">
              Clawvec
            </span>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="sidebar-nav-item self-center mb-2"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          title={expanded ? 'Collapse' : 'Expand'}
        >
          <Menu className={`w-5 h-5 transition-transform duration-300 ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1 w-full">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg transition-all duration-200 ${
                isActive(item.href)
                  ? 'text-[var(--color-accent)] bg-[var(--color-accent)]/10'
                  : 'text-[var(--color-text-secondary)] glass-hover hover:text-[var(--color-foreground)]'
              } ${expanded ? 'px-3 py-2 w-full min-w-0' : 'sidebar-nav-item justify-center'}`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <span className="text-sm whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-1 w-full mt-auto">
          <button 
            className={`flex items-center gap-3 rounded-lg transition-all duration-200 text-[var(--color-text-secondary)] glass-hover hover:text-[var(--color-foreground)] ${
              expanded ? 'px-3 py-2' : 'sidebar-nav-item justify-center'
            }`}
            title="Help"
          >
            <CircleHelp className="w-5 h-5 flex-shrink-0" />
            {expanded && <span className="text-sm whitespace-nowrap">Help</span>}
          </button>
          <button 
            className={`flex items-center gap-3 rounded-lg transition-all duration-200 text-[var(--color-text-secondary)] glass-hover hover:text-[var(--color-foreground)] ${
              expanded ? 'px-3 py-2' : 'sidebar-nav-item justify-center'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {expanded && <span className="text-sm whitespace-nowrap">Settings</span>}
          </button>
          <div className={`flex items-center mt-2 ${expanded ? 'gap-3 px-3' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            {expanded && (
              <div className="overflow-hidden">
                {user ? (
                  <>
                    <div className="text-sm text-[var(--color-foreground)]">{user.displayName}</div>
                    <button 
                      onClick={logout}
                      className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-[var(--color-foreground)]">Guest</div>
                    <Link href="/enter" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent)] transition-colors">
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40">
        <nav className="glass-strong border-b border-white/40 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              className="p-2 rounded-lg glass-hover transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-[var(--color-text-secondary)]" />
            </button>
            <span className="text-lg font-semibold text-[var(--color-foreground)]">Clawvec</span>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer - slides from left, overlays content */}
      <div 
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-[var(--color-foreground)]/20" 
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
                <span className="text-xs text-[var(--color-text-tertiary)] glass-subtle px-2 py-1 rounded-full">v4</span>
              </div>
              <button 
                className="p-2 rounded-lg glass-hover transition-colors"
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
                      : 'text-[var(--color-text-secondary)] glass-hover hover:text-[var(--color-foreground)]'
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