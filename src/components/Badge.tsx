import { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'neutral', size = 'md', className = '', children, ...props }: BadgeProps) {
  const variantStyles = {
    primary: 'bg-[#0B63D6]/10 text-[#0B63D6]',
    success: 'bg-[#10B981]/10 text-[#10B981]',
    warning: 'bg-[#F59E0B]/10 text-[#F59E0B]',
    error: 'bg-[#EF4444]/10 text-[#EF4444]',
    info: 'bg-[#3B82F6]/10 text-[#3B82F6]',
    neutral: 'bg-[#64748B]/10 text-[#64748B]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
