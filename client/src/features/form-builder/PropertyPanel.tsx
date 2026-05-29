import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import { TextInput } from '@shared/ui/TextInput';
import { FieldShell } from '@shared/ui/_FieldShell';
import type { FieldDef } from '@shared/types';
import './PropertyPanel.css';

interface PropertyPanelProps {
  field: FieldDef | null;
  onChange: (patch: Partial<FieldDef>) => void;
}

export function PropertyPanel({ field, onChange }: PropertyPanelProps) {
  const { t } = useTranslation('admin');

  return (
    <aside className="property-panel">
      <Typography variant="h5">{t('formBuilder.properties')}</Typography>
      {!field ? (
        <Typography variant="caption">Select a field on the canvas.</Typography>
      ) : (
        <div className="property-panel__form">
          <FieldShell label={t('formBuilder.props.label')}>
            <TextInput
              value={field.label}
              onChange={(e) => onChange({ label: e.target.value })}
            />
          </FieldShell>
          <FieldShell label={t('formBuilder.props.name')}>
            <TextInput
              value={field.name}
              onChange={(e) => onChange({ name: e.target.value.replace(/\s+/g, '_') })}
            />
          </FieldShell>
          {field.type !== 'button' && (
            <>
              {field.type !== 'checkbox' && field.type !== 'switch' && (
                <FieldShell label={t('formBuilder.props.placeholder')}>
                  <TextInput
                    value={field.placeholder ?? ''}
                    onChange={(e) => onChange({ placeholder: e.target.value })}
                  />
                </FieldShell>
              )}

              <label className="property-panel__check">
                <input
                  type="checkbox"
                  checked={Boolean(field.required)}
                  onChange={(e) => onChange({ required: e.target.checked })}
                />
                <span>{t('formBuilder.props.required')}</span>
              </label>

              {(field.type === 'text' || field.type === 'richtext') && (
                <label className="property-panel__check">
                  <input
                    type="checkbox"
                    checked={Boolean(field.multilingual)}
                    onChange={(e) => onChange({ multilingual: e.target.checked })}
                  />
                  <span>{t('formBuilder.props.multilingual')}</span>
                </label>
              )}

              {field.type === 'select' && (
                <FieldShell label={t('formBuilder.props.options')}>
                  <textarea
                    className="property-panel__textarea"
                    rows={5}
                    value={(field.options ?? []).map((o) => `${o.value}|${o.label}`).join('\n')}
                    onChange={(e) =>
                      onChange({
                        options: e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const [value, label] = line.split('|');
                            return { value: value ?? '', label: label ?? value ?? '' };
                          }),
                      })
                    }
                    placeholder="value|label"
                  />
                </FieldShell>
              )}

              <FieldShell label="Min length">
                <TextInput
                  type="number"
                  value={field.validation?.minLength ?? ''}
                  onChange={(e) =>
                    onChange({
                      validation: {
                        ...field.validation,
                        minLength: e.target.value === '' ? undefined : Number(e.target.value),
                      },
                    })
                  }
                />
              </FieldShell>
              <FieldShell label="Max length">
                <TextInput
                  type="number"
                  value={field.validation?.maxLength ?? ''}
                  onChange={(e) =>
                    onChange({
                      validation: {
                        ...field.validation,
                        maxLength: e.target.value === '' ? undefined : Number(e.target.value),
                      },
                    })
                  }
                />
              </FieldShell>
              <FieldShell label="Pattern (regex)">
                <TextInput
                  value={field.validation?.pattern ?? ''}
                  onChange={(e) =>
                    onChange({
                      validation: { ...field.validation, pattern: e.target.value || undefined },
                    })
                  }
                />
              </FieldShell>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
