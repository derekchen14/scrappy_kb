import { useState, useEffect, useMemo, useRef } from 'react';

type Option<T extends string> = { label: string; value: T };

interface CustomSelectProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
  placeholder?: string;
  className?: string;
  label?: string;
}

function CustomSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  label,
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const idBase = useMemo(() => Math.random().toString(36).slice(2), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!open) return;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label htmlFor={`custom-${idBase}`} className="mb-1 block text-xs font-medium text-gray-700">
          {label}
        </label>
      )}
      <button
        id={`custom-${idBase}`}
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`listbox-${idBase}`}
        onClick={() => setOpen(o => !o)}
        className="w-56 inline-flex items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className={selected ? '' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          id={`listbox-${idBase}`}
          role="listbox"
          className="absolute z-20 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {options.map(opt => {
            const selected = value === opt.value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={selected}
                tabIndex={0}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-blue-50 
                  ${selected ? 'bg-blue-50 font-medium text-blue-900' : 'text-gray-900'}`}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
