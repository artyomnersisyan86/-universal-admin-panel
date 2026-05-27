import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldDef, TableColumnDef, TableRow } from '@shared/types';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { FormGroup } from '@shared/ui/FormGroup';
import { uploadFile } from '@shared/api/uploads';
import './RowFormDialog.css';

export interface RowFormDialogProps {
  columns: TableColumnDef[];
  initialRow?: TableRow | null;
  title: string;
  submitLabel: string;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  onClose: () => void;
}

export function RowFormDialog({
  columns,
  initialRow,
  title,
  submitLabel,
  onSubmit,
  onClose,
}: RowFormDialogProps) {
  const { t } = useTranslation('admin');
  const hasMultilingual = columns.some((c) => c.multilingual);
  const schema = useMemo<FieldDef[]>(() => {
    const fields: FieldDef[] = columns.map((c) => columnToField(c));
    fields.push({
      id: '__submit__',
      type: 'button',
      name: '__submit__',
      label: submitLabel,
      buttonAction: 'submit',
      buttonVariant: 'primary',
    });
    return fields;
  }, [columns, submitLabel]);

  const defaultValues = useMemo(
    () => buildDefaultsFromRow(columns, initialRow?.data),
    [columns, initialRow],
  );

  return (
    <div className="row-form-dialog__backdrop" onClick={onClose}>
      <div className="row-form-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="row-form-dialog__header">
          <Typography variant="h3">{title}</Typography>
          <Button variant="text" size="small" onClick={onClose}>
            ✕
          </Button>
        </header>
        <div className="row-form-dialog__body">
          {hasMultilingual && (
            <p
              className="row-form-dialog__hint"
              dangerouslySetInnerHTML={{ __html: t('tables.rowFormMultilingualHint') }}
            />
          )}
          <FormGroup
            schema={schema}
            defaultValues={defaultValues}
            uploadFn={uploadFile}
            onSubmit={async (values) => {
              const { __submit__, ...rest } = values as Record<string, unknown>;
              void __submit__;
              await onSubmit(normalize(columns, rest));
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function columnToField(col: TableColumnDef): FieldDef {
  const base = {
    id: col.key,
    name: col.key,
    label: col.label,
    multilingual: col.multilingual,
  };
  switch (col.type) {
    case 'richtext':
      return { ...base, type: 'richtext' };
    case 'image':
      return { ...base, type: 'image', multilingual: false };
    case 'boolean':
      return {
        ...base,
        type: 'select',
        multilingual: false,
        options: [
          { value: 'true', label: '✓ true' },
          { value: 'false', label: '× false' },
        ],
      };
    case 'number':
      return { ...base, type: 'text', placeholder: '0' };
    case 'text':
    default:
      return { ...base, type: 'text' };
  }
}

function buildDefaultsFromRow(
  columns: TableColumnDef[],
  data: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    const v = data?.[col.key];
    if (col.multilingual) {
      const obj = (v as Record<string, string>) ?? {};
      out[col.key] = { hy: obj.hy ?? '', ru: obj.ru ?? '', en: obj.en ?? '' };
    } else if (col.type === 'boolean') {
      out[col.key] = v === true ? 'true' : v === false ? 'false' : '';
    } else if (col.type === 'number') {
      out[col.key] = v == null ? '' : String(v);
    } else {
      out[col.key] = v == null ? '' : String(v);
    }
  }
  return out;
}

function normalize(
  columns: TableColumnDef[],
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    const v = raw[col.key];
    if (col.type === 'boolean') {
      out[col.key] = v === 'true' ? true : v === 'false' ? false : null;
    } else if (col.type === 'number') {
      const n = Number(v);
      out[col.key] = Number.isFinite(n) && v !== '' ? n : null;
    } else {
      out[col.key] = v ?? (col.multilingual ? { hy: '', ru: '', en: '' } : '');
    }
  }
  return out;
}
