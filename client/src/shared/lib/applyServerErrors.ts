import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';

export type ServerErrors = Record<string, string | Record<string, string>>;

/**
 * Apply server-returned field errors to a react-hook-form instance.
 *
 * Single-language:    { fieldName: "message" }              → setError("fieldName", { message })
 * Multilingual field: { fieldName: { hy: "msg", en: "x" } } → setError("fieldName.hy", { message })
 */
export function applyServerErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  errors: ServerErrors | undefined,
): void {
  if (!errors) return;
  for (const [field, value] of Object.entries(errors)) {
    if (typeof value === 'string') {
      setError(field as Path<T>, { type: 'server', message: value });
      continue;
    }
    for (const [lang, message] of Object.entries(value)) {
      setError(`${field}.${lang}` as Path<T>, { type: 'server', message });
    }
  }
}
