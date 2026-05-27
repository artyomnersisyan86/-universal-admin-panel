import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FieldDef } from '@shared/types';
import { applyServerErrors, type ServerErrors } from '@shared/lib/applyServerErrors';
import { buildDefaultValues, buildZodSchema } from './buildZodSchema';
import { FieldRenderer } from './FieldRenderer';
import './FormGroup.css';

export interface FormGroupProps {
  /** Fields defined by the Form Builder. */
  schema: FieldDef[];
  /** Initial values keyed by field.name (multilingual fields keyed by {hy,ru,en}). */
  defaultValues?: Record<string, unknown>;
  /** Called on valid submit. */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  /** Server-side errors to display under fields (e.g., from 400 response). */
  serverErrors?: ServerErrors;
  /** Optional file uploader for image/file fields. */
  uploadFn?: (file: File) => Promise<string>;
  /** Disable inputs (read-only). */
  disabled?: boolean;
}

/**
 * FormGroup — schema-driven form using react-hook-form + Zod.
 *
 * Pass the form-builder field list as `schema`. The component:
 *   1. Builds a Zod schema (including multilingual {hy, ru, en} shapes).
 *   2. Renders each field via FieldRenderer.
 *   3. Applies server errors via `applyServerErrors`.
 */
export function FormGroup({
  schema,
  defaultValues,
  onSubmit,
  serverErrors,
  uploadFn,
  disabled,
}: FormGroupProps) {
  const zodSchema = buildZodSchema(schema);
  const methods = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: defaultValues ?? buildDefaultValues(schema),
    mode: 'onBlur',
  });

  useEffect(() => {
    applyServerErrors(methods.setError, serverErrors);
  }, [serverErrors, methods]);

  return (
    <FormProvider {...methods}>
      <form
        className="form-group"
        onSubmit={methods.handleSubmit(onSubmit)}
        noValidate
      >
        <fieldset className="form-group__fieldset" disabled={disabled}>
          {schema.map((f) => (
            <FieldRenderer key={f.id} field={f} uploadFn={uploadFn} />
          ))}
        </fieldset>
      </form>
    </FormProvider>
  );
}
