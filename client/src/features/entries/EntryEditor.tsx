import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AxiosError } from 'axios';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { FieldRenderer, buildZodSchema } from '@shared/ui/FormGroup';
import type { ApiErrorBody } from '@shared/lib/apiClient';
import { applyServerErrors, type ServerErrors } from '@shared/lib/applyServerErrors';
import { uploadFile } from '@shared/api/uploads';
import type { Entry, EntryStatus } from '@shared/api/entries';
import type {
  BlockNode,
  BlockStyle,
  FieldWidth,
  FlexLayout,
  Section,
  Slide,
  SupportedLanguage,
} from '@shared/types';
import { normalizeLayout, toPlainText } from '@features/section-builder';
import { SlidesEditor } from '@features/section-builder/SlidesEditor';
import { useCreateEntry, useUpdateEntry } from './useEntries';
import { buildEntryDefaults, collectFieldDefs, collectSliderBlocks } from './entryData';
import './EntryEditor.css';

interface Props {
  section: Section;
  /** Existing entry to edit. Omit for create mode. */
  entry?: Entry;
}

/**
 * Fills a section's layout with entry data. The block tree is rendered live:
 * typography/containers reproduce the layout while field & slider blocks become
 * editable inputs bound to the entry `data` (fields keyed by `field.name`,
 * sliders by block id). Save keeps the current status; Publish promotes a draft.
 */
export function EntryEditor({ section, entry }: Props) {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const lang = (i18n.resolvedLanguage as SupportedLanguage) || 'hy';

  const layout = useMemo(() => normalizeLayout(section.layout), [section.layout]);

  const schema = useMemo(() => {
    const fieldSchema = buildZodSchema(collectFieldDefs(layout.root));
    const sliderShape = Object.fromEntries(
      collectSliderBlocks(layout.root).map((b) => [b.id, z.array(z.any()).optional()]),
    );
    return fieldSchema.extend(sliderShape);
  }, [layout]);

  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: buildEntryDefaults(layout, entry?.data),
    mode: 'onBlur',
  });

  const createMut = useCreateEntry(section.slug);
  const updateMut = useUpdateEntry(section.slug, entry?.id ?? '');

  const [serverErrors, setServerErrors] = useState<ServerErrors | undefined>();
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [topError, setTopError] = useState<string | null>(null);

  useEffect(() => {
    applyServerErrors(methods.setError, serverErrors);
  }, [serverErrors, methods]);

  const saveStatus: EntryStatus = entry?.status ?? 'draft';
  const pending = createMut.isPending || updateMut.isPending;

  function submitWith(status: EntryStatus) {
    return methods.handleSubmit(async (values) => {
      setTopError(null);
      setServerErrors(undefined);
      try {
        if (entry) {
          await updateMut.mutateAsync({ data: values, status });
          setSavedAt(new Date());
        } else {
          const created = await createMut.mutateAsync({ data: values, status });
          navigate(`/c/${section.slug}/${created.id}`, { replace: true });
        }
      } catch (err) {
        const body = (err as AxiosError<ApiErrorBody>).response?.data;
        if (body?.errors) setServerErrors(body.errors);
        else setTopError((err as Error).message);
      }
    });
  }

  return (
    <FormProvider {...methods}>
      <form className="entry-editor" onSubmit={(e) => e.preventDefault()} noValidate>
        <header className="entry-editor__header">
          <div>
            <Typography variant="h2">
              {section.name[lang] || section.name.en || section.slug}
            </Typography>
            <Typography variant="caption" className="entry-editor__sub">
              {entry
                ? t('admin:entries.editing')
                : t('admin:entries.creating')}
              {' · '}
              <span
                className={`entry-editor__status entry-editor__status--${saveStatus}`}
              >
                {t(`admin:entries.status.${saveStatus}`)}
              </span>
            </Typography>
          </div>
          <div className="entry-editor__actions">
            {savedAt && (
              <Typography variant="caption" className="entry-editor__saved">
                {t('admin:sectionBuilder.savedAt', { time: savedAt.toLocaleTimeString() })}
              </Typography>
            )}
            {topError && (
              <Typography variant="caption" className="entry-editor__error">
                ⚠ {topError}
              </Typography>
            )}
            <Button variant="outlined" onClick={submitWith(saveStatus)} loading={pending}>
              {t('admin:entries.save')}
            </Button>
            {saveStatus !== 'published' && (
              <Button onClick={submitWith('published')} loading={pending}>
                {t('admin:entries.publish')}
              </Button>
            )}
          </div>
        </header>

        <div className="entry-editor__layout-hint">
          <span>{t('admin:entries.layoutHint')}</span>
          <Link to={`/settings/sections/${section.id}`}>
            {t('admin:entries.editLayout')}
          </Link>
        </div>

        <div className="entry-editor__canvas">
          {layout.root.length === 0 ? (
            <Typography variant="body" className="entry-editor__empty">
              {t('admin:entries.emptyLayout')}
            </Typography>
          ) : (
            layout.root.map((block) => <EntryBlock key={block.id} block={block} />)
          )}
        </div>
      </form>
    </FormProvider>
  );
}

// ---------------------------------------------------------------------------
// Recursive block renderer — self-contained styling (no builder CSS deps) so
// the editor renders consistently outside the canvas. Uses the desktop base
// style/layout; responsive overrides are a published-view concern.
// ---------------------------------------------------------------------------

function styleToCss(style?: BlockStyle): CSSProperties {
  if (!style) return {};
  const hasBorder = Boolean(style.borderColor || style.borderWidth);
  return {
    backgroundColor: style.backgroundColor,
    color: style.textColor,
    padding: style.padding,
    margin: style.margin,
    borderRadius: style.borderRadius,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    borderStyle: hasBorder ? 'solid' : undefined,
  };
}

const WIDTH_PCT: Record<Exclude<FieldWidth, 'auto'>, string> = {
  '100%': '100%',
  '50%': '50%',
  '33%': '33.3333%',
};

function widthCss(width?: FieldWidth): CSSProperties {
  if (!width || width === 'auto') return {};
  return { width: WIDTH_PCT[width], flexShrink: 1 };
}

function layoutToCss(layout?: FlexLayout): CSSProperties {
  const isRow = layout?.direction === 'row';
  return {
    display: 'flex',
    flexDirection: isRow ? 'row' : 'column',
    gap: layout?.gap ?? 'var(--space-3)',
    justifyContent: layout?.justifyContent,
    alignItems: layout?.alignItems,
    flexWrap: isRow ? layout?.wrap ?? 'wrap' : undefined,
  };
}

function EntryBlock({ block }: { block: BlockNode }) {
  const width = 'width' in block.props ? block.props.width : undefined;
  const wrapperStyle: CSSProperties = {
    ...styleToCss(block.props.style),
    ...widthCss(width),
  };
  return (
    <div className={`entry-block entry-block--${block.type}`} style={wrapperStyle}>
      <EntryBlockBody block={block} />
    </div>
  );
}

function EntryBlockBody({ block }: { block: BlockNode }) {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as SupportedLanguage) || 'hy';

  switch (block.type) {
    case 'typography': {
      const value = block.props.text;
      const text =
        block.props.multilingual && typeof value === 'object'
          ? value[lang] || toPlainText(value)
          : toPlainText(value);
      return <Typography variant={block.props.variant}>{text}</Typography>;
    }
    case 'field':
      return <FieldRenderer field={block.props.field} uploadFn={uploadFile} />;
    case 'container':
      return (
        <div style={layoutToCss(block.props.layout)}>
          {block.children.map((child) => (
            <EntryBlock key={child.id} block={child} />
          ))}
        </div>
      );
    case 'slider':
      return <SliderField blockId={block.id} />;
  }
}

/** Slider bound to entry data (keyed by block id) via react-hook-form. */
function SliderField({ blockId }: { blockId: string }) {
  return (
    <Controller
      name={blockId}
      render={({ field }) => (
        <SlidesEditor
          slides={(field.value as Slide[]) ?? []}
          onChange={(slides) => field.onChange(slides)}
        />
      )}
    />
  );
}
