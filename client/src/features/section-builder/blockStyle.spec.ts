import { describe, expect, it } from 'vitest';
import type { ContainerBlock } from '@shared/types';
import {
  bodyStyleVars,
  widthToCss,
  containerLayoutVars,
  getResolvedStyle,
  getResolvedLayout,
  getResolvedWidth,
} from './blockStyle';

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

describe('cascade style/layout/width resolution', () => {
  const dummyBlock = (props: ContainerBlock['props']): ContainerBlock => ({
    id: 'block-1',
    type: 'container',
    props,
    children: [],
  });

  describe('getResolvedStyle', () => {
    it('returns base style for desktop', () => {
      const b = dummyBlock({
        style: { backgroundColor: '#fff' },
        responsive: {
          tablet: { style: { backgroundColor: '#000' } },
        },
      });
      expect(getResolvedStyle(b, 'desktop')).toEqual({ backgroundColor: '#fff' });
    });

    it('returns merged base + tablet style for tablet', () => {
      const b = dummyBlock({
        style: { backgroundColor: '#fff', textColor: '#222' },
        responsive: {
          tablet: { style: { backgroundColor: '#000' } },
        },
      });
      expect(getResolvedStyle(b, 'tablet')).toEqual({
        backgroundColor: '#000',
        textColor: '#222',
      });
    });

    it('returns merged base + tablet + mobile style for mobile', () => {
      const b = dummyBlock({
        style: { backgroundColor: '#fff', textColor: '#222', padding: '10px' },
        responsive: {
          tablet: { style: { backgroundColor: '#000', padding: '20px' } },
          mobile: { style: { padding: '5px' } },
        },
      });
      expect(getResolvedStyle(b, 'mobile')).toEqual({
        backgroundColor: '#000',
        textColor: '#222',
        padding: '5px',
      });
    });
  });

  describe('getResolvedLayout', () => {
    it('returns base layout for desktop', () => {
      const b = dummyBlock({
        layout: { direction: 'row' },
        responsive: {
          tablet: { layout: { direction: 'column' } },
        },
      });
      expect(getResolvedLayout(b, 'desktop')).toEqual({ direction: 'row' });
    });

    it('returns tablet override for tablet', () => {
      const b = dummyBlock({
        layout: { direction: 'row', gap: '10px' },
        responsive: {
          tablet: { layout: { direction: 'column' } },
        },
      });
      expect(getResolvedLayout(b, 'tablet')).toEqual({
        direction: 'column',
        gap: '10px',
      });
    });
  });

  describe('getResolvedWidth', () => {
    it('returns width for desktop', () => {
      const b = dummyBlock({
        width: '50%',
        responsive: {
          tablet: { width: '100%' },
        },
      });
      expect(getResolvedWidth(b, 'desktop')).toEqual('50%');
    });

    it('returns tablet fallback for mobile when mobile is empty', () => {
      const b = dummyBlock({
        width: '50%',
        responsive: {
          tablet: { width: '100%' },
        },
      });
      expect(getResolvedWidth(b, 'mobile')).toEqual('100%');
    });

    it('returns base fallback for mobile when both tablet and mobile are empty', () => {
      const b = dummyBlock({
        width: '50%',
        responsive: {},
      });
      expect(getResolvedWidth(b, 'mobile')).toEqual('50%');
    });
  });
});

