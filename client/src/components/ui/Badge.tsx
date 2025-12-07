import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-[#3e2989]/10 text-[#3e2989] ring-[#3e2989]/15',
  success: 'bg-[#4DBE55]/10 text-[#2b7a31] ring-[#4DBE55]/20',
  warning: 'bg-amber-100 text-amber-800 ring-amber-300/80',
  danger: 'bg-rose-100 text-rose-700 ring-rose-200',
};

export function Badge({ className, tone = 'neutral', ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
