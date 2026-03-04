import { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    required?: boolean;
    /** Show a validation error state */
    error?: boolean;
}

export function CustomSelect({
    options,
    value,
    onChange,
    placeholder = 'Sélectionner...',
    disabled = false,
    className,
    required,
    error,
}: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const id = useId();

    const selected = options.find((o) => o.value === value);

    // Close on outside click
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); }
        if (e.key === 'Escape') setOpen(false);
        if (e.key === 'ArrowDown' && open) {
            e.preventDefault();
            const idx = options.findIndex((o) => o.value === value);
            const next = options[idx + 1];
            if (next) onChange(next.value);
        }
        if (e.key === 'ArrowUp' && open) {
            e.preventDefault();
            const idx = options.findIndex((o) => o.value === value);
            const prev = options[idx - 1];
            if (prev) onChange(prev.value);
        }
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {/* Trigger */}
            <button
                id={id}
                type="button"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-required={required}
                onKeyDown={handleKeyDown}
                onClick={() => !disabled && setOpen((o) => !o)}
                className={cn(
                    'flex h-11 w-full items-center justify-between gap-3 rounded-xl border px-4 text-sm transition-all duration-200 outline-none select-none',
                    // Base states
                    'bg-zinc-950/80 text-zinc-200 border-zinc-800',
                    // Hover
                    !disabled && 'hover:border-zinc-600',
                    // Focus-visible
                    'focus-visible:ring-2 focus-visible:ring-violet-500/30 focus-visible:border-violet-500',
                    // Open state
                    open && 'border-violet-500 ring-2 ring-violet-500/20',
                    // Error state
                    error && 'border-red-500/60 ring-1 ring-red-500/20',
                    // Disabled state
                    disabled && 'opacity-40 cursor-not-allowed',
                )}
            >
                <span
                    className={cn(
                        'truncate text-left',
                        !selected ? 'text-zinc-600' : 'text-zinc-200',
                    )}
                >
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        'h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {/* Dropdown panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scaleY: 0.96 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -4, scaleY: 0.97 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        style={{ transformOrigin: 'top' }}
                        role="listbox"
                        className={cn(
                            'absolute top-[calc(100%+6px)] left-0 right-0 z-50',
                            'rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60',
                            'max-h-64 overflow-y-auto',
                            'py-1.5',
                        )}
                    >
                        {options.length === 0 && (
                            <div className="px-4 py-3 text-sm text-zinc-600 italic">
                                Aucune option disponible
                            </div>
                        )}
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={cn(
                                        'flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors duration-100',
                                        isSelected
                                            ? 'bg-violet-600/15 text-violet-300 font-semibold'
                                            : 'text-zinc-300 hover:bg-white/[0.05] hover:text-white',
                                    )}
                                >
                                    <span className="truncate">{option.label}</span>
                                    {isSelected && (
                                        <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
