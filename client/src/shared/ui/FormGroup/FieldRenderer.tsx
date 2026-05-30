import { Controller, useFormContext } from 'react-hook-form';
import type { FieldDef, SupportedLanguage } from '@shared/types';
import { FieldShell } from '../_FieldShell';
import { TextInput } from '../TextInput';
import { Select } from '../Select';
import { RichTextEditor } from '../RichTextEditor';
import { ImageUpload } from '../ImageUpload';
import { FileUpload } from '../FileUpload';
import { LanguageTabs } from '../LanguageTabs';
import { Button } from '../Button';
import { RepeaterField } from './RepeaterField';

export interface FieldRendererProps {
  field: FieldDef;
  /** Optional uploader passed down for image/file fields. */
  uploadFn?: (file: File) => Promise<string>;
  /**
   * When rendering inside a RepeaterField row, pass the dot-path prefix
   * so that controllers register under the correct array path.
   * e.g. namePrefix="items.0" + field.name="title" → "items.0.title"
   */
  namePrefix?: string;
}

/** Renders a single FieldDef using react-hook-form's Controller. */
export function FieldRenderer({ field, uploadFn, namePrefix }: FieldRendererProps) {
  const { control, formState } = useFormContext();

  const controlName = namePrefix ? `${namePrefix}.${field.name}` : field.name;
  const errorForField = formState.errors[field.name];

  if (field.type === 'button') {
    return (
      <Button
        variant={field.buttonVariant ?? 'primary'}
        type={field.buttonAction ?? 'submit'}
      >
        {field.label}
      </Button>
    );
  }

  if (field.type === 'repeater') {
    return (
      <RepeaterField
        field={field as FieldDef & { type: 'repeater' }}
        name={controlName}
        uploadFn={uploadFn}
      />
    );
  }

  // Boolean fields render inline (label next to control), no FieldShell wrapping.
  if (field.type === 'checkbox' || field.type === 'switch') {
    return (
      <Controller
        control={control}
        name={controlName}
        render={({ field: ctrl }) => (
          <label
            className={
              field.type === 'switch' ? 'form-group__switch' : 'form-group__checkbox'
            }
          >
            <input
              type="checkbox"
              checked={Boolean(ctrl.value)}
              onChange={(e) => ctrl.onChange(e.target.checked)}
              onBlur={ctrl.onBlur}
            />
            {field.type === 'switch' && <span className="form-group__switch-track" aria-hidden />}
            <span>{field.label}</span>
          </label>
        )}
      />
    );
  }

  if (field.multilingual) {
    const langErrors = (errorForField as Record<string, { message?: string }> | undefined) ?? {};
    return (
      <FieldShell
        label={field.label}
        required={field.required}
        error={undefined /* errors shown per-tab below */}
      >
        <LanguageTabs
          hasError={(lang) => Boolean(langErrors?.[lang])}
          render={(lang: SupportedLanguage) => (
            <Controller
              control={control}
              name={`${controlName}.${lang}`}
              render={({ field: ctrl, fieldState }) => (
                <div>
                  {renderInputForType(field, ctrl, fieldState.invalid, uploadFn)}
                  {fieldState.error?.message && (
                    <p className="field__error" role="alert">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          )}
        />
      </FieldShell>
    );
  }

  return (
    <Controller
      control={control}
      name={controlName}
      render={({ field: ctrl, fieldState }) => (
        <FieldShell
          label={field.label}
          required={field.required}
          error={fieldState.error?.message}
        >
          {renderInputForType(field, ctrl, fieldState.invalid, uploadFn)}
        </FieldShell>
      )}
    />
  );
}

type ControllerField = {
  value: unknown;
  onChange: (v: unknown) => void;
  onBlur: () => void;
  name: string;
};

function renderInputForType(
  field: FieldDef,
  ctrl: ControllerField,
  invalid: boolean,
  uploadFn?: (file: File) => Promise<string>,
) {
  switch (field.type) {
    case 'text':
      return (
        <TextInput
          placeholder={field.placeholder}
          value={(ctrl.value as string) ?? ''}
          onChange={(e) => ctrl.onChange(e.target.value)}
          onBlur={ctrl.onBlur}
          invalid={invalid}
        />
      );
    case 'select':
      return (
        <Select
          options={field.options ?? []}
          placeholder={field.placeholder}
          value={(ctrl.value as string) ?? ''}
          onChange={(e) => ctrl.onChange(e.target.value)}
          onBlur={ctrl.onBlur}
          invalid={invalid}
        />
      );
    case 'richtext':
      return (
        <RichTextEditor
          value={(ctrl.value as string) ?? ''}
          onChange={(html) => ctrl.onChange(html)}
          placeholder={field.placeholder}
        />
      );
    case 'image':
      return (
        <ImageUpload
          value={(ctrl.value as string) || undefined}
          onChange={(url) => ctrl.onChange(url ?? '')}
          uploadFn={uploadFn}
        />
      );
    case 'file':
      return (
        <FileUpload
          value={(ctrl.value as string) || undefined}
          onChange={(url) => ctrl.onChange(url ?? '')}
          uploadFn={uploadFn}
        />
      );
    default:
      return null;
  }
}
