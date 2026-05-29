import { useTranslation } from 'react-i18next';
import { TextInput } from '@shared/ui/TextInput';
import { Select } from '@shared/ui/Select';
import { FieldShell } from '@shared/ui/_FieldShell';
import type { FieldBlock, FieldDef, FieldType } from '@shared/types';

interface Props {
  block: FieldBlock;
  onPatch: (patch: (b: FieldBlock) => FieldBlock) => void;
}

const FIELD_TYPES: FieldType[] = [
  'text',
  'select',
  'checkbox',
  'switch',
  'richtext',
  'image',
  'file',
  'button',
];

function patchField(
  block: FieldBlock,
  patch: Partial<FieldDef>,
): FieldBlock {
  return {
    ...block,
    props: { ...block.props, field: { ...block.props.field, ...patch } },
  };
}

export function FieldProps({ block, onPatch }: Props) {
  const { t } = useTranslation(['admin']);
  const f = block.props.field;
  const setField = (patch: Partial<FieldDef>) => onPatch((b) => patchField(b, patch));

  return (
    <>
      <FieldShell label={t('admin:sectionBuilder.props.fieldType')}>
        <Select
          options={FIELD_TYPES.map((ft) => ({ value: ft, label: ft }))}
          value={f.type}
          onChange={(e) => {
            const next = e.target.value as FieldType;
            setField({
              type: next,
              options:
                next === 'select'
                  ? f.options ?? [{ value: 'opt1', label: 'Option 1' }]
                  : undefined,
              buttonAction: next === 'button' ? f.buttonAction ?? 'submit' : undefined,
              buttonVariant: next === 'button' ? f.buttonVariant ?? 'primary' : undefined,
            });
          }}
        />
      </FieldShell>

      <FieldShell label={t('admin:formBuilder.props.label')}>
        <TextInput value={f.label} onChange={(e) => setField({ label: e.target.value })} />
      </FieldShell>

      <FieldShell label={t('admin:formBuilder.props.name')}>
        <TextInput
          value={f.name}
          onChange={(e) =>
            setField({ name: e.target.value.replace(/\s+/g, '_').toLowerCase() })
          }
        />
      </FieldShell>

      {f.type !== 'button' && f.type !== 'checkbox' && f.type !== 'switch' && (
        <FieldShell label={t('admin:formBuilder.props.placeholder')}>
          <TextInput
            value={f.placeholder ?? ''}
            onChange={(e) => setField({ placeholder: e.target.value })}
          />
        </FieldShell>
      )}

      {f.type !== 'button' && (
        <label className="property-panel__check">
          <input
            type="checkbox"
            checked={Boolean(f.required)}
            onChange={(e) => setField({ required: e.target.checked })}
          />
          <span>{t('admin:formBuilder.props.required')}</span>
        </label>
      )}

      {(f.type === 'text' || f.type === 'richtext') && (
        <label className="property-panel__check">
          <input
            type="checkbox"
            checked={Boolean(f.multilingual)}
            onChange={(e) => setField({ multilingual: e.target.checked })}
          />
          <span>{t('admin:formBuilder.props.multilingual')}</span>
        </label>
      )}

      {f.type === 'select' && (
        <FieldShell label={t('admin:formBuilder.props.options')}>
          <textarea
            className="property-panel__textarea"
            rows={5}
            value={(f.options ?? []).map((o) => `${o.value}|${o.label}`).join('\n')}
            onChange={(e) =>
              setField({
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
    </>
  );
}
