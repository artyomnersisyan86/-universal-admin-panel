import { useTranslation } from 'react-i18next';
import { TextInput } from '@shared/ui/TextInput';
import { Select } from '@shared/ui/Select';
import { FieldShell } from '@shared/ui/_FieldShell';
import type { FieldBlock, FieldDef, FieldType, SelectOption } from '@shared/types';

interface Props {
  block: FieldBlock;
  onPatch: (patch: (b: FieldBlock) => FieldBlock) => void;
}

/** Field types allowed as top-level section-builder fields. */
const FIELD_TYPES: FieldType[] = [
  'text',
  'select',
  'checkbox',
  'switch',
  'richtext',
  'image',
  'file',
  'button',
  'repeater',
];

/** Field types allowed as sub-fields inside a repeater (no nested repeater in UI). */
const SUB_FIELD_TYPES: Exclude<FieldType, 'repeater'>[] = [
  'text',
  'select',
  'checkbox',
  'switch',
  'image',
  'file',
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
              subFields: next === 'repeater' ? f.subFields ?? [] : undefined,
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

      {f.type !== 'button' && f.type !== 'checkbox' && f.type !== 'switch' && f.type !== 'repeater' && (
        <FieldShell label={t('admin:formBuilder.props.placeholder')}>
          <TextInput
            value={f.placeholder ?? ''}
            onChange={(e) => setField({ placeholder: e.target.value })}
          />
        </FieldShell>
      )}

      {f.type !== 'button' && f.type !== 'repeater' && (
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
        <SelectOptionsEditor
          options={f.options ?? []}
          onChange={(options) => setField({ options })}
        />
      )}

      {f.type === 'repeater' && (
        <SubFieldsEditor
          subFields={f.subFields ?? []}
          onChange={(subFields) => setField({ subFields })}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-field editor — flat list of FieldDef entries for a repeater block
// ---------------------------------------------------------------------------

interface SubFieldsEditorProps {
  subFields: FieldDef[];
  onChange: (subFields: FieldDef[]) => void;
}

function SubFieldsEditor({ subFields, onChange }: SubFieldsEditorProps) {
  const { t } = useTranslation('admin');

  function addSubField() {
    onChange([
      ...subFields,
      {
        id: crypto.randomUUID(),
        type: 'text',
        name: `field_${subFields.length + 1}`,
        label: `Field ${subFields.length + 1}`,
      },
    ]);
  }

  function removeSubField(id: string) {
    onChange(subFields.filter((sf) => sf.id !== id));
  }

  function patchSubField(id: string, patch: Partial<FieldDef>) {
    onChange(
      subFields.map((sf) => (sf.id === id ? { ...sf, ...patch } : sf)),
    );
  }

  return (
    <div className="sub-fields-editor">
      <span className="sub-fields-editor__title">
        {t('sectionBuilder.repeater.subFields')}
      </span>

      {subFields.length === 0 && (
        <p className="sub-fields-editor__empty">
          {t('sectionBuilder.repeater.noSubFields')}
        </p>
      )}

      {subFields.map((sf) => (
        <div key={sf.id} className="sub-fields-editor__row">
          <Select
            options={SUB_FIELD_TYPES.map((ft) => ({ value: ft, label: ft }))}
            value={sf.type}
            onChange={(e) =>
              patchSubField(sf.id, { type: e.target.value as FieldType })
            }
          />
          <TextInput
            placeholder={t('sectionBuilder.repeater.subFieldName')}
            value={sf.name}
            onChange={(e) =>
              patchSubField(sf.id, {
                name: e.target.value.replace(/\s+/g, '_').toLowerCase(),
              })
            }
          />
          <TextInput
            placeholder={t('sectionBuilder.repeater.subFieldLabel')}
            value={sf.label}
            onChange={(e) => patchSubField(sf.id, { label: e.target.value })}
          />
          <button
            type="button"
            className="sub-fields-editor__remove"
            onClick={() => removeSubField(sf.id)}
            aria-label="Remove sub-field"
          >
            ×
          </button>
        </div>
      ))}

      <button
        type="button"
        className="sub-fields-editor__add"
        onClick={addSubField}
      >
        {t('sectionBuilder.repeater.addSubField')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select options editor — inline rows instead of raw "value|label" textarea
// ---------------------------------------------------------------------------

interface SelectOptionsEditorProps {
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
}

function SelectOptionsEditor({ options, onChange }: SelectOptionsEditorProps) {
  const { t } = useTranslation('admin');

  function addOption() {
    onChange([...options, { value: `opt${options.length + 1}`, label: `Option ${options.length + 1}` }]);
  }

  function removeOption(idx: number) {
    onChange(options.filter((_, i) => i !== idx));
  }

  function patchOption(idx: number, patch: Partial<SelectOption>) {
    onChange(options.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  }

  return (
    <div className="select-opts-editor">
      <span className="sub-fields-editor__title">{t('admin:formBuilder.props.options')}</span>
      {options.map((opt, idx) => (
        <div key={idx} className="select-opts-editor__row">
          <TextInput
            placeholder="value"
            value={opt.value}
            onChange={(e) => patchOption(idx, { value: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
          />
          <TextInput
            placeholder="Label"
            value={opt.label}
            onChange={(e) => patchOption(idx, { label: e.target.value })}
          />
          <button
            type="button"
            className="sub-fields-editor__remove"
            onClick={() => removeOption(idx)}
            aria-label="Remove option"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="sub-fields-editor__add" onClick={addOption}>
        + Add option
      </button>
    </div>
  );
}
