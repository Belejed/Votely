import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, checked, onChange, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <label 
        htmlFor={inputId} 
        className={cn('flex items-center justify-between gap-4 cursor-pointer select-none py-1 group', className)}
      >
        {(label || description) && (
          <div className="flex flex-col flex-1">
            {label && <span className="text-sm font-semibold text-text-main leading-tight group-hover:text-brand-primary transition-colors">{label}</span>}
            {description && <span className="text-xs text-text-muted mt-0.5 leading-normal">{description}</span>}
          </div>
        )}
        <div className="relative inline-flex items-center shrink-0">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />
          <div className="w-11 h-6 bg-border-main peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary shadow-inner"></div>
        </div>
      </label>
    );
  }
);
Switch.displayName = 'Switch';
