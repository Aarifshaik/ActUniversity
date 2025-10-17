import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Card({ hover = false, padding = 'md', className = '', children, ...props }: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover
    ? 'hover:scale-[1.02] hover:shadow-lg cursor-pointer transition-all duration-75'
    : '';

  return (
    <div
      className={`bg-white rounded-xl border border-[#E2E8F0] shadow-sm ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
