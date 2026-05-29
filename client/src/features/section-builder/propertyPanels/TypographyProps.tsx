import { useTranslation } from 'react-i18next';
import { TextInput } from '@shared/ui/TextInput';
import { Select } from '@shared/ui/Select';
import { LanguageTabs } from '@shared/ui/LanguageTabs';
import { FieldShell } from '@shared/ui/_FieldShell';
import type {
  Multilingual,
  TypographyBlock,
  TypographyVariant,
} from '@shared/types';
import { toMultilingual, toPlainText } from '../blockTree';

interface Props {
  block: TypographyBlock;
  onPatch: (patch: (b: TypographyBlock) => TypographyBlock) => void;
}

const VARIANTS: TypographyVariant[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'body', 'caption'];

export function TypographyProps({ block, onPatch }: Props) {
  const { t } = useTranslation('admin');

  return (
    <>
      <FieldShell label={t('sectionBuilder.props.variant')}>
        <Select
          options={VARIANTS.map((v) => ({ value: v, label: v }))}
          value={block.props.variant}
          onChange={(e) =>
            onPatch((b) => ({
              ...b,
              props: { ...b.props, variant: e.target.value as TypographyVariant },
            }))
          }
        />
      </FieldShell>

      <label className="property-panel__check">
        <input
          type="checkbox"
          checked={block.props.multilingual}
          onChange={(e) =>
            onPatch((b) => {
              const next = e.target.checked;
              const text = next ? toMultilingual(b.props.text) : toPlainText(b.props.text);
              return {
                ...b,
                props: { ...b.props, multilingual: next, text },
              };
            })
          }
        />
        <span>{t('sectionBuilder.props.multilingual')}</span>
      </label>

      {block.props.multilingual ? (
        <FieldShell label={t('sectionBuilder.props.text')}>
          <LanguageTabs
            hasContent={(lang) => {
              const text = block.props.text as Multilingual<string>;
              return Boolean(text[lang]?.trim());
            }}
            render={(lang) => (
              <TextInput
                value={(block.props.text as Multilingual<string>)[lang]}
                onChange={(e) =>
                  onPatch((b) => {
                    const current = b.props.text as Multilingual<string>;
                    return {
                      ...b,
                      props: {
                        ...b.props,
                        text: { ...current, [lang]: e.target.value },
                      },
                    };
                  })
                }
              />
            )}
          />
        </FieldShell>
      ) : (
        <FieldShell label={t('sectionBuilder.props.text')}>
          <TextInput
            value={typeof block.props.text === 'string' ? block.props.text : ''}
            onChange={(e) =>
              onPatch((b) => ({ ...b, props: { ...b.props, text: e.target.value } }))
            }
          />
        </FieldShell>
      )}
    </>
  );
}
