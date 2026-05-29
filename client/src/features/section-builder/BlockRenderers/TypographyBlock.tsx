import { useTranslation } from 'react-i18next';
import { Typography } from '@shared/ui/Typography';
import type { SupportedLanguage, TypographyBlock } from '@shared/types';
import { toPlainText } from '../blockTree';

interface Props {
  block: TypographyBlock;
}

export function TypographyBlockView({ block }: Props) {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage as SupportedLanguage) || 'hy';
  const text =
    block.props.multilingual && typeof block.props.text === 'object'
      ? block.props.text[lang] || toPlainText(block.props.text)
      : toPlainText(block.props.text);

  return (
    <Typography variant={block.props.variant}>
      {text || <em className="sb-typography__placeholder">(empty)</em>}
    </Typography>
  );
}
