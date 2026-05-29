import type { FieldDef, FieldType } from '@shared/types';

export interface PaletteItem {
  type: FieldType;
  i18nKey: string;
}

export const PALETTE: PaletteItem[] = [
  { type: 'text', i18nKey: 'formBuilder.field.text' },
  { type: 'select', i18nKey: 'formBuilder.field.select' },
  { type: 'checkbox', i18nKey: 'formBuilder.field.checkbox' },
  { type: 'switch', i18nKey: 'formBuilder.field.switch' },
  { type: 'richtext', i18nKey: 'formBuilder.field.richtext' },
  { type: 'image', i18nKey: 'formBuilder.field.image' },
  { type: 'file', i18nKey: 'formBuilder.field.file' },
  { type: 'button', i18nKey: 'formBuilder.field.button' },
];

export function makeFieldDef(type: FieldType, count: number): FieldDef {
  const id = crypto.randomUUID();
  return {
    id,
    type,
    name: `${type}_${count + 1}`,
    label: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${count + 1}`,
    placeholder: '',
    required: false,
    multilingual: false,
    options: type === 'select' ? [{ value: 'opt1', label: 'Option 1' }] : undefined,
    buttonAction: type === 'button' ? 'submit' : undefined,
    buttonVariant: type === 'button' ? 'primary' : undefined,
  };
}
