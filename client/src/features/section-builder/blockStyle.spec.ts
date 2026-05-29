import { describe, expect, it } from 'vitest';
import { bodyStyleVars, widthToCss, containerLayoutVars } from './blockStyle';

describe('bodyStyleVars', () => {
  it('returns an empty object for no style', () => {
    expect(bodyStyleVars(undefined)).toEqual({});
    expect(bodyStyleVars({})).toEqual({});
  });

  it('emits only the defined values as --sb-* vars', () => {
    expect(bodyStyleVars({ backgroundColor: 'var(--color-primary)', padding: '0' })).toEqual({
      '--sb-bg': 'var(--color-primary)',
      '--sb-pad': '0',
    });
  });

  it('maps every style field to its var', () => {
    expect(
      bodyStyleVars({
        backgroundColor: '#fff',
        textColor: '#000',
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        borderColor: '#ccc',
        borderWidth: '1px',
      }),
    ).toEqual({
      '--sb-bg': '#fff',
      '--sb-fg': '#000',
      '--sb-pad': 'var(--space-3)',
      '--sb-radius': 'var(--radius-md)',
      '--sb-border-color': '#ccc',
      '--sb-border-width': '1px',
    });
  });
});

describe('widthToCss', () => {
  it('returns no width for auto/undefined', () => {
    expect(widthToCss(undefined)).toEqual({});
    expect(widthToCss('auto')).toEqual({});
  });

  it('maps percentage widths and allows shrinking', () => {
    expect(widthToCss('100%')).toEqual({ width: '100%', flexShrink: 1 });
    expect(widthToCss('50%')).toEqual({ width: '50%', flexShrink: 1 });
    expect(widthToCss('33%')).toEqual({ width: '33.3333%', flexShrink: 1 });
  });
});

describe('containerLayoutVars', () => {
  it('returns an empty object when nothing is set', () => {
    expect(containerLayoutVars(undefined)).toEqual({});
    expect(containerLayoutVars({ direction: 'row' })).toEqual({});
  });

  it('emits gap/justify/align vars when present', () => {
    expect(
      containerLayoutVars({
        direction: 'row',
        gap: 'var(--space-3)',
        justifyContent: 'space-between',
        alignItems: 'center',
      }),
    ).toEqual({
      '--sb-gap': 'var(--space-3)',
      '--sb-justify': 'space-between',
      '--sb-align': 'center',
    });
  });
});
