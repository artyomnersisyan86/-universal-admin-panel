import { forwardRef, type InputHTMLAttributes } from 'react';
import './TextInput.css';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  invalid?: boolean;
}

/** Bare themed text input. Use inside FormGroup or FieldShell for label/error. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { invalid, className = '', type = 'text', ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={`text-input${invalid ? ' text-input--invalid' : ''}${className ? ` ${className}` : ''}`}
      {...rest}
    />
  );
});
