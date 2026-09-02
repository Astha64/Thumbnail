import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline';
}

const variantClasses = {
  default: 'bg-surface-card border border-surface-border',
  glass: 'glass-card',
  outline: 'bg-transparent border border-surface-border',
};

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  return (
    <div
      className={cn(
        'rounded-2xl p-6',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
