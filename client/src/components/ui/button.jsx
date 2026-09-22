import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        navCta:
          'text-foreground bg-nav-button hover:bg-nav-button/80 active:scale-[0.97] transition-all',
        hero:
          'bg-primary text-primary-foreground hover:brightness-110 transition-all active:scale-[0.97]',
        heroOutline:
          'bg-white text-background hover:brightness-90 transition-all active:scale-[0.97]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border border-border bg-transparent text-foreground hover:bg-muted',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm rounded-md',
        sm: 'h-9 px-3 text-xs rounded-md',
        lg: 'h-11 px-6 text-sm rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants };
