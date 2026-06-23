import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useState } from 'react'

const tabVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg',
  {
    variants: {
      variant: {
        default: 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]/30 hover:text-[var(--color-foreground)]',
        active: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
        underline: 'border-b-2 border-transparent hover:border-[var(--color-text-secondary)]',
        'underline-active': 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const tabListVariants = cva(
  'inline-flex gap-1',
  {
    variants: {
      orientation: {
        horizontal: 'flex-row',
        vertical: 'flex-col',
      },
    },
    defaultVariants: {
      orientation: 'horizontal',
    },
  }
)

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  content?: React.ReactNode
  disabled?: boolean
}

export interface TabProps {
  tabs: TabItem[]
  defaultTab?: string
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'underline'
  onChange?: (tabId: string) => void
  className?: string
}

const Tabs = forwardRef<HTMLDivElement, TabProps>(
  ({ tabs, defaultTab, orientation = 'horizontal', variant = 'default', onChange, className }, ref) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

    const handleTabChange = (tabId: string) => {
      if (tabs.find(t => t.id === tabId)?.disabled) return
      setActiveTab(tabId)
      onChange?.(tabId)
    }

    const activeTabData = tabs.find(t => t.id === activeTab)

    return (
      <div ref={ref} className={cn('flex flex-col gap-4', className)}>
        <div className={cn(tabListVariants({ orientation }))} role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-disabled={tab.disabled}
              disabled={tab.disabled}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                tabVariants({
                  variant: activeTab === tab.id
                    ? (variant === 'underline' ? 'underline-active' : 'active')
                    : (variant === 'underline' ? 'underline' : 'default')
                }),
                tab.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
            </button>
          ))}
        </div>
        {activeTabData?.content && (
          <div role="tabpanel" className="mt-2">
            {activeTabData.content}
          </div>
        )}
      </div>
    )
  }
)
Tabs.displayName = 'Tabs'

export { Tabs, tabVariants, tabListVariants }
