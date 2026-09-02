import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  default: 'bg-slate-800 text-slate-300 border-slate-700',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/25',
  info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25',
  brand: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  tone = 'default',
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border',
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
