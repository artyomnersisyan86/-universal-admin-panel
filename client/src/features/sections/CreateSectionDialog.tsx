import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import { Typography } from '@shared/ui/Typography';
import { Button } from '@shared/ui/Button';
import { TextInput } from '@shared/ui/TextInput';
import { LanguageTabs } from '@shared/ui/LanguageTabs';
import { FieldShell } from '@shared/ui/_FieldShell';
import { SUPPORTED_LANGUAGES, type Multilingual, type SupportedLanguage } from '@shared/types';
import { type ApiErrorBody } from '@shared/lib/apiClient';
import { emptyLayout } from '../section-builder/blockTree';
import { useCreateSection } from './useSections';
import './CreateSectionDialog.css';

interface CreateSectionDialogProps {
  onClose: () => void;
  onCreated: (id: string) => void;
}

type ErrorMap = Partial<Record<'slug' | 'name', string | Multilingual<string>>>;

const SLUG_RE = /^[a-z0-9-]+$/;
const SLUG_MAX = 64;

const emptyName = (): Multilingual<string> => ({ hy: '', ru: '', en: '' });

export function CreateSectionDialog({ onClose, onCreated }: CreateSectionDialogProps) {
  const { t } = useTranslation(['admin', 'common']);
  const create = useCreateSection();

  const [slug, setSlug] = useState('');
  const [name, setName] = useState<Multilingual<string>>(emptyName);
  const [isPublic, setIsPublic] = useState(true);
  const [errors, setErrors] = useState<ErrorMap>({});

  function validate(): ErrorMap {
    const next: ErrorMap = {};
    if (!slug.trim()) next.slug = t('admin:sections.errors.slugRequired');
    else if (!SLUG_RE.test(slug)) next.slug = t('admin:sections.errors.slugFormat');
    else if (slug.length > SLUG_MAX) next.slug = t('admin:sections.errors.slugLong');

    const nameErrs: Partial<Multilingual<string>> = {};
    for (const lang of SUPPORTED_LANGUAGES) {
      if (!name[lang].trim()) nameErrs[lang] = t('admin:sections.errors.nameRequired');
    }
    if (Object.keys(nameErrs).length > 0) next.name = nameErrs as Multilingual<string>;
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    try {
      const created = await create.mutateAsync({
        slug: slug.trim(),
        name,
        layout: emptyLayout(),
        isPublic,
      });
      onCreated(created.id);
    } catch (err) {
      const ax = err as AxiosError<ApiErrorBody>;
      const serverErrors = ax.response?.data?.errors;
      if (serverErrors) {
        const mapped: ErrorMap = {};
        if (typeof serverErrors.slug === 'string') mapped.slug = serverErrors.slug;
        if (serverErrors.name && typeof serverErrors.name === 'object')
          mapped.name = serverErrors.name as Multilingual<string>;
        setErrors(mapped);
      }
    }
  }

  const nameError = (lang: SupportedLanguage): string | undefined => {
    const err = errors.name;
    if (!err || typeof err === 'string') return undefined;
    return err[lang];
  };

  return (
    <div className="section-create" role="dialog" aria-label={t('admin:sections.create')}>
      <header className="section-create__header">
        <Typography variant="h5">{t('admin:sections.create')}</Typography>
        <Button variant="text" size="small" onClick={onClose}>
          ×
        </Button>
      </header>

      <form className="section-create__form" onSubmit={handleSubmit}>
        <FieldShell
          label={t('admin:sections.slug')}
          required
          error={typeof errors.slug === 'string' ? errors.slug : undefined}
        >
          <TextInput
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
            }
            placeholder={t('admin:sections.slugPlaceholder')}
            invalid={Boolean(errors.slug)}
            maxLength={SLUG_MAX}
          />
        </FieldShell>

        <FieldShell label={t('admin:sections.name')} required>
          <LanguageTabs
            hasContent={(lang) => Boolean(name[lang].trim())}
            hasError={(lang) => Boolean(nameError(lang))}
            render={(lang) => (
              <>
                <TextInput
                  value={name[lang]}
                  onChange={(e) =>
                    setName((n) => ({ ...n, [lang]: e.target.value }))
                  }
                  placeholder={t(`admin:sections.namePlaceholder.${lang}`)}
                  invalid={Boolean(nameError(lang))}
                />
                {nameError(lang) && (
                  <p className="section-create__inline-error">{nameError(lang)}</p>
                )}
              </>
            )}
          />
        </FieldShell>

        <label className="section-create__check">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>{t('admin:sections.public')}</span>
          <small>{t('admin:sections.publicHint')}</small>
        </label>

        <div className="section-create__actions">
          <Button type="button" variant="text" onClick={onClose}>
            {t('common:app.cancel')}
          </Button>
          <Button type="submit" loading={create.isPending}>
            {t('common:app.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
