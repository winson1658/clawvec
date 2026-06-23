import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useState } from 'react'
import { Check, X } from 'lucide-react'

const filterVariants = cva(
  // Base styles
  'inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-all duration-200 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'glass text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]/50',
        active: 'bg-[var(--color-accent)]/10 text-[var(--color-accent)] border border-[var(--color-accent)]/30',
        'active-solid': 'bg-[var(--color-accent)] text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface FilterOption {
  id: string
  label: string
  icon?: React.ReactNode
  count?: number
}

export interface FilterProps {
  options: FilterOption[]
  defaultSelected?: string[]
  mode?: 'single' | 'multiple'
  onChange?: (selected: string[]) => void
  className?: string
  showClear?: boolean
}

const Filter = forwardRef<HTMLDivElement, FilterProps>(
  ({ options, defaultSelected = [], mode = 'multiple', onChange, className, showClear = true }, ref) => {
    const [selected, setSelected] = useState<string[]>(defaultSelected)

    const handleSelect = (optionId: string) => {
      let newSelected: string[]
      
      if (mode === 'single') {
        newSelected = selected.includes(optionId) ? [] : [optionId]
      } else {
        newSelected = selected.includes(optionId)
          ? selected.filter(id => id !== optionId)
          : [...selected, optionId]
      }
      
      setSelected(newSelected)
      onChange?.(newSelected)
    }

    const handleClear = () => {
      setSelected([])
      onChange?.([])
    }

    return (
      <div ref={ref} className={cn('flex flex-wrap items-center gap-2', className)}>
        {options.map((option) => {
          const isSelected = selected.includes(option.id)
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                filterVariants({ variant: isSelected ? 'active' : 'default' }),
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/20'
              )}
              aria-pressed={isSelected}
            >
              {option.icon && <span className="w-4 h-4">{option.icon}</span>}
              <span>{option.label}</span>
              {option.count !== undefined && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  isSelected ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]' : 'bg-[var(--color-background)]/30 text-[var(--color-text-tertiary)]'
                )}>
                  {option.count}
                </span>
              )}
              {isSelected && mode === 'multiple' && (
                <X className="w-3 h-3 ml-1" />
              )}
            </button>
          )
        })}
        
        {showClear && selected.length > 0 && (
          <button
            onClick={handleClear}
            className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors px-2"
          >
            Clear
          </button>
        )}
      </div>
    )
  }
)
Filter.displayName = 'Filter'

export { Filter, filterVariants }
