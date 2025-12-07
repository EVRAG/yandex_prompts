import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

interface TimerPillProps extends HTMLAttributes<HTMLDivElement> {
  value: number | null;
  isCounting?: boolean;
}

export function TimerPill({ value, isCounting = true, className, ...rest }: TimerPillProps) {
  if (value === null) return null;
  return (
    <div
      className={cn(
        'rounded-full bg-[#7a55ff] text-white px-3 py-1 text-sm font-mono',
        className,
      )}
      {...rest}
    >
      {value > 0 && isCounting ? `${value}s` : value > 0 ? value : 'Время вышло'}
    </div>
  );
}
