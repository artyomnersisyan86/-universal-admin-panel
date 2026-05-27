import type { ReactNode } from 'react';
import './FieldShell.css';

export interface FieldShellProps {
  label?: string;
  required?: boolean;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}

/**
 * FieldShell — internal wrapper for form fields.
 * Provides a label, required indicator, and an error message slot below the input.
 */
export function FieldShell({ label, required, error, htmlFor, children }: FieldShellProps) {
  return (
    <div className={`field${error ? ' field--has-error' : ''}`}>
      {label && (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="field__required" aria-hidden> *</span>}
        </label>
      )}
      <div className="field__control">{children}</div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
