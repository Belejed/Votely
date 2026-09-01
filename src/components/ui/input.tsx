import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border border-border-main bg-background px-4 py-2 text-sm text-text-main ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:border-brand-primary/60 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
            error && 'border-danger focus-visible:ring-danger/40 focus-visible:border-danger',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs font-medium text-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
