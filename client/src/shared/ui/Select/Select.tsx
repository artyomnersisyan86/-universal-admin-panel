import { forwardRef, type SelectHTMLAttributes } from 'react';
import type { SelectOption } from '@shared/types';
import './Select.css';

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: SelectOption[];
  invalid?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, invalid, placeholder, className = '', ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`select${invalid ? ' select--invalid' : ''}${className ? ` ${className}` : ''}`}
      {...rest}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
});
