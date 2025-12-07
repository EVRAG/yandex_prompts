import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const base =
  'inline-flex items-center justify-center rounded-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:
    'bg-[#7a55ff] text-white hover:bg-[#6c4ae6] focus-visible:outline-[#7a55ff]',
  secondary:
    'bg-white text-[#3e2989] ring-1 ring-[#3e2989]/15 hover:bg-[#f4f1ff] focus-visible:outline-[#3e2989]',
  ghost:
    'bg-transparent text-[#3e2989] hover:bg-[#3e2989]/10 focus-visible:outline-[#3e2989]',
};

const sizes: Record<Size, string> = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...props}
    />
  );
}
