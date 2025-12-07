import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[12px] shadow-sm border border-black/5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
