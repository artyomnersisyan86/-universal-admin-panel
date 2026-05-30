import { z, type ZodTypeAny } from 'zod';
import type { FieldDef, SupportedLanguage } from '@shared/types';

const LANGS: SupportedLanguage[] = ['hy', 'ru', 'en'];

/**
 * Build a Zod schema from a FormBuilder field definition list.
 *
 * - Plain field:       { name: string }              required → nonempty
 * - Multilingual:      { name: { hy, ru, en } }     required → every language nonempty
 */
export function buildZodSchema(fields: FieldDef[]) {
  const shape: Record<string, ZodTypeAny> = {};

  for (const f of fields) {
    if (f.type === 'button') continue;

    if (f.type === 'repeater') {
      const rowSchema = buildZodSchema(f.subFields ?? []);
      shape[f.name] = z.array(rowSchema).optional();
      continue;
    }

    if (f.type === 'checkbox' || f.type === 'switch') {
      shape[f.name] = f.required
        ? z.literal(true, { message: 'required' })
        : z.boolean().optional();
      continue;
    }

    if (f.multilingual) {
      const langShape: Record<string, ZodTypeAny> = {};
      for (const lang of LANGS) {
        let s: ZodTypeAny = z.string();
        if (f.required) {
          s = (s as z.ZodString).min(1, { message: 'required' });
        } else {
          s = (s as z.ZodString).optional();
        }
        s = applyValidation(s, f);
        langShape[lang] = s;
      }
      shape[f.name] = z.object(langShape);
      continue;
    }

    let s: ZodTypeAny;
    if (f.type === 'image' || f.type === 'file') {
      s = z.string().url().or(z.string().length(0));
      if (f.required) s = z.string().min(1, { message: 'required' });
    } else {
      s = z.string();
      if (f.required) s = (s as z.ZodString).min(1, { message: 'required' });
      else s = (s as z.ZodString).optional();
      s = applyValidation(s, f);
    }
    shape[f.name] = s;
  }

  return z.object(shape);
}

function applyValidation(s: ZodTypeAny, f: FieldDef): ZodTypeAny {
  const v = f.validation;
  if (!v) return s;
  let result = s;
  if (v.minLength != null && result instanceof z.ZodString) {
    result = result.min(v.minLength, { message: `tooShort` });
  }
  if (v.maxLength != null && result instanceof z.ZodString) {
    result = result.max(v.maxLength, { message: `tooLong` });
  }
  if (v.pattern && result instanceof z.ZodString) {
    try {
      result = result.regex(new RegExp(v.pattern), { message: `invalid` });
    } catch {
      /* invalid regex string — skip */
    }
  }
  return result;
}

/** Build default form values for a field list. */
export function buildDefaultValues(fields: FieldDef[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.type === 'button') continue;
    if (f.type === 'repeater') {
      values[f.name] = [];
      continue;
    }
    if (f.type === 'checkbox' || f.type === 'switch') {
      values[f.name] = false;
    } else if (f.multilingual) {
      values[f.name] = { hy: '', ru: '', en: '' };
    } else {
      values[f.name] = '';
    }
  }
  return values;
}
