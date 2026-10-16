import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const chipVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-normal select-none transition-colors duration-120',
  {
    variants: {
      variant: {
        default: 'bg-surface-3 text-text-secondary border border-border',
        thread: 'bg-surface-3 text-thread border border-border',
        brass: 'bg-surface-3 text-brass border border-border',
        inspector: 'bg-surface-3 text-inspector border border-border',
        cleared: 'bg-surface-3 text-status-cleared border border-border',
        impossible: 'bg-surface-3 text-status-impossible border border-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {
  icon?: React.ReactNode;
}

export function Chip({ className, variant, icon, children, ...props }: ChipProps) {
  return (
    <span className={cn(chipVariants({ variant, className }))} {...props}>
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
