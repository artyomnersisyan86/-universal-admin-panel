import { useFieldArray, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { buildDefaultValues } from './buildZodSchema';
import { FieldRenderer } from './FieldRenderer';
import type { FieldDef } from '@shared/types';
import './RepeaterField.css';

interface RepeaterFieldProps {
  field: FieldDef & { type: 'repeater' };
  /**
   * Full dot-path for useFieldArray. Computed by the parent FieldRenderer
   * to handle nested repeaters correctly (e.g. "items.0.sublist").
   * Falls back to field.name when at root level.
   */
  name: string;
  uploadFn?: (file: File) => Promise<string>;
}

/**
 * Renders a repeatable list of rows, each row containing the sub-fields
 * defined on the FieldDef. Values stored at `name[index].subFieldName`.
 * Uses Up/Down buttons for reordering (keeps shared/ui portable — no dnd-kit).
 */
export function RepeaterField({ field, name, uploadFn }: RepeaterFieldProps) {
  const { t } = useTranslation('admin');
  const { control } = useFormContext();
  const subFields = field.subFields ?? [];

  const { fields, append, remove, move } = useFieldArray({ control, name });

  return (
    <div className="repeater">
      {fields.length === 0 && (
        <p className="repeater__empty">{t('repeater.empty')}</p>
      )}

      {fields.map((row, index) => (
        <div key={row.id} className="repeater__row">
          <div className="repeater__row-header">
            <span className="repeater__row-label">
              {t('repeater.row', { index: index + 1 })}
            </span>
            <div className="repeater__row-actions">
              <button
                type="button"
                className="repeater__btn repeater__btn--move"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                aria-label={t('repeater.moveUp')}
                title={t('repeater.moveUp')}
              >
                ↑
              </button>
              <button
                type="button"
                className="repeater__btn repeater__btn--move"
                onClick={() => move(index, index + 1)}
                disabled={index === fields.length - 1}
                aria-label={t('repeater.moveDown')}
                title={t('repeater.moveDown')}
              >
                ↓
              </button>
              <button
                type="button"
                className="repeater__btn repeater__btn--remove"
                onClick={() => remove(index)}
                aria-label={t('repeater.removeRow')}
                title={t('repeater.removeRow')}
              >
                ×
              </button>
            </div>
          </div>

          <div className="repeater__row-body">
            {subFields.map((sf) => (
              <FieldRenderer
                key={sf.id}
                field={sf}
                namePrefix={`${name}.${index}`}
                uploadFn={uploadFn}
              />
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        className="repeater__add"
        onClick={() => append(buildDefaultValues(subFields))}
      >
        {t('repeater.addRow')}
      </button>
    </div>
  );
}
