import * as React from 'react';
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center rounded-md font-medium select-none transition-all outline-none focus-visible:ring-2 focus-visible:ring-thread focus-visible:ring-offset-2 active:scale-95 disabled:opacity-40 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed',
        primary: 'bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed',
        secondary: 'bg-surface-3 text-text-primary hover:bg-surface-2',
        ghost: 'bg-transparent text-text-secondary hover:bg-surface-2 hover:text-text-primary',
        outline: 'border border-border bg-transparent text-text-primary hover:bg-surface-2',
        brass: 'bg-brass text-on-brass hover:opacity-90',
      },
      size: {
        default: 'h-10 gap-2 px-4 text-sm',
        sm: 'h-8 gap-1.5 px-3 text-xs',
        lg: 'h-12 gap-2.5 px-6 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends ButtonPrimitive.Props,
    VariantProps<typeof buttonVariants> {
  className?: string;
}

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
