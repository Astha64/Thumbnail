import React from 'react';
import { cn } from '../../lib/utils';
import { Monitor, Smartphone, Square } from 'lucide-react';

type Variant = 'youtube' | 'shorts' | 'square';

interface VariantSelectorProps {
  selected: Variant;
  onSelect: (variant: Variant) => void;
}

const variants: { key: Variant; label: string; icon: React.ReactNode }[] = [
  { key: 'youtube', label: 'YouTube', icon: <Monitor className="w-3.5 h-3.5" /> },
  { key: 'shorts', label: 'Shorts', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { key: 'square', label: 'Square', icon: <Square className="w-3.5 h-3.5" /> },
];

export const VariantSelector: React.FC<VariantSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex gap-1 bg-slate-900/70 rounded-lg p-1 border border-surface-border">
      {variants.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onSelect(v.key)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
            selected === v.key
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
          )}
        >
          {v.icon}
          {v.label}
        </button>
      ))}
    </div>
  );
};

export type { Variant };
