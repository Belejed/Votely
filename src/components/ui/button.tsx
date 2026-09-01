import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          {
            // Variants
            'button-gradient text-white shadow-md shadow-brand-primary/10 hover-lift': variant === 'primary',
            'bg-card border border-border-main text-text-main hover:bg-background hover-lift': variant === 'secondary',
            'border-2 border-brand-primary/20 text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5': variant === 'outline',
            'text-brand-primary hover:bg-brand-primary/5': variant === 'ghost',
            'bg-linear-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-md shadow-red-500/10 hover-lift': variant === 'danger',
            
            // Sizes
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-7 py-3.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
