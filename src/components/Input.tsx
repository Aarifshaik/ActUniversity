import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#0F1724] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 text-base text-[#0F1724] bg-white border rounded-lg transition-colors duration-75 focus:outline-none focus:ring-2 focus:ring-[#0B63D6] focus:border-transparent disabled:bg-[#F7FAFC] disabled:cursor-not-allowed ${
            error ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-[#EF4444]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[#64748B]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
