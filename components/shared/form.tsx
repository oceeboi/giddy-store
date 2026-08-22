'use client';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import React, { forwardRef, useEffect, useRef, useState } from 'react';
function Field({
  label,
  error,
  children,
  delay = 0,
  xx, // Accept the optional 'xx' prop
  className = '', // Accept the optional 'className' prop
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  delay?: number;
  xx?: boolean; // Add the optional 'xx' prop
  className?: string; // Accept the optional 'className' prop
}) {
  return (
    <div
      className="space-y-1.5 animate-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <label className={cn('block text-sm font-semibold text-gray-700', className)}>
        {label} {xx && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Text input ───────────────────────────────────────────────────────────────
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

function Input({ hasError, className = '', ...rest }: InputProps) {
  return (
    <input
      className={`
        w-full px-4 py-3 rounded border text-sm bg-white text-gray-900
        placeholder:text-gray-400 outline-none transition-all duration-200
        focus:ring-2 focus:ring-[#000000]/30 focus:border-[#000000]
        ${hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'}
        ${className}
      `}
      {...rest}
    />
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ hasError, className, disabled, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        className={cn(
          // Base styles matching your Input UI
          'w-full px-4 py-3 rounded-md border text-sm bg-white text-gray-900',
          'placeholder:text-gray-400 outline-none transition-all duration-200 resize-y',
          'focus:ring-2 focus:ring-black/30 focus:border-black',
          // Error vs Normal state
          hasError
            ? 'border-red-400 bg-red-50 focus:ring-red-200 focus:border-red-500 text-red-900 placeholder:text-red-300'
            : 'border-gray-200 hover:border-gray-300',
          // Disabled state styling
          disabled && 'cursor-not-allowed bg-gray-100 opacity-60 hover:border-gray-200',
          // Custom class overrides
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textareas';
// ─── Password input with show/hide ────────────────────────────────────────────
function PasswordInput({ hasError, ...rest }: Omit<InputProps, 'type'>) {
  const [visible, setVisible] = useState<boolean>(false);

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} hasError={hasError} className="pr-12" {...rest} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                   hover:text-gray-600 transition-colors p-1"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45
                     0 015.06-5.94"
            />
            <path
              d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0
                     01-2.16 3.19"
            />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

type Option = { value: string; label: string; id: string };

interface CustomSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  placeholder?: string;
}

function CustomSelect({
  options,
  value,
  onChange,
  disabled,
  hasError,
  placeholder = 'Select an option',
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Match option based on its unique MongoDB id instead of string slug value
  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between border border-gray-200 hover:border-gray-300 bg-white px-3 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-black ${
          hasError ? 'border-red-500' : 'border-black/20'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-black/30'}`}
      >
        <span className={selectedOption ? 'font-medium text-[#1d2128]' : 'text-[#5f6570]'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#5f6570] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto  border border-black/10 bg-white py-1 shadow-lg">
          {options.map((option) => {
            const isSelected = option.id === value;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#1d2128] font-medium text-white'
                    : 'text-[#1d2128] hover:bg-[#fafafa]'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { Field, Input, PasswordInput, CustomSelect };
