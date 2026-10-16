import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const stampVariants = cva(
  'inline-block select-none font-mono text-xs font-semibold tracking-wider uppercase px-2 py-0.5 rounded-sm border-2 -rotate-3 transition-transform duration-200 animate-in fade-in zoom-in-110',
  {
    variants: {
      status: {
        contradiction: 'border-status-contradiction text-status-contradiction',
        rehearsed: 'border-status-rehearsed text-status-rehearsed',
        impossible: 'border-status-impossible text-status-impossible',
        cleared: 'border-status-cleared text-status-cleared',
        inferred: 'border-status-inferred text-status-inferred',
        slip: 'border-status-contradiction text-status-contradiction',
        custom: 'border-text-secondary text-text-secondary',
      },
    },
    defaultVariants: {
      status: 'contradiction',
    },
  }
);

export interface StampProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof stampVariants> {
  label: string;
}

export function Stamp({ className, status, label, ...props }: StampProps) {
  return (
    <span className={cn(stampVariants({ status, className }))} {...props}>
      {label}
    </span>
  );
}
