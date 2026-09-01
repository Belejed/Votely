import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        {
          'bg-brand-primary/10 text-brand-primary border border-brand-primary/20': variant === 'default',
          'bg-success/10 text-success border border-success/20': variant === 'success',
          'bg-warning/10 text-warning border border-warning/20': variant === 'warning',
          'bg-danger/10 text-danger border border-danger/20': variant === 'danger',
          'bg-brand-accent/15 text-brand-primary border border-brand-accent/30': variant === 'info',
        },
        className
      )}
      {...props}
    />
  );
}
