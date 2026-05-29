import { describe, expect, it } from 'vitest';
import type { BlockNode, ContainerBlock, TypographyBlock } from '@shared/types';
import {
  emptyLayout,
  findById,
  indexOfId,
  insertAt,
  makeContainerBlock,
  makeFieldBlock,
  makeTypographyBlock,
  moveById,
  normalizeLayout,
  removeById,
  toMultilingual,
  toPlainText,
  updateById,
} from './blockTree';

function typography(id: string, text = 'X'): TypographyBlock {
  return {
    id,
    type: 'typography',
    props: { variant: 'h2', text, multilingual: false },
  };
}

function container(id: string, children: BlockNode[] = []): ContainerBlock {
  return { id, type: 'container', props: {}, children };
}

describe('blockTree', () => {
  it('emptyLayout returns versioned empty tree', () => {
    expect(emptyLayout()).toEqual({ version: 1, root: [] });
  });

  describe('normalizeLayout', () => {
    it('falls back to empty layout for null/undefined', () => {
      expect(normalizeLayout(null)).toEqual({ version: 1, root: [] });
      expect(normalizeLayout(undefined)).toEqual({ version: 1, root: [] });
    });

    it('keeps a valid layout', () => {
      const t = typography('a');
      expect(normalizeLayout({ version: 1, root: [t] })).toEqual({
        version: 1,
        root: [t],
      });
    });

    it('forces version=1 even if missing', () => {
      const t = typography('a');
      expect(normalizeLayout({ root: [t] })).toEqual({ version: 1, root: [t] });
    });

    it('coerces non-array root to []', () => {
      expect(normalizeLayout({ version: 1, root: 'oops' })).toEqual({
        version: 1,
        root: [],
      });
    });
  });

  describe('findById / indexOfId', () => {
    it('finds top-level nodes', () => {
      const a = typography('a');
      const b = typography('b');
      expect(findById([a, b], 'b')).toBe(b);
      expect(indexOfId([a, b], 'b')).toBe(1);
    });

    it('recurses into containers', () => {
      const inner = typography('inner');
      const root = container('root', [inner]);
      expect(findById([root], 'inner')).toBe(inner);
    });

    it('returns null when missing', () => {
      expect(findById([typography('a')], 'missing')).toBeNull();
      expect(indexOfId([typography('a')], 'missing')).toBe(-1);
    });
  });

  describe('insertAt', () => {
    it('inserts at given index', () => {
      const a = typography('a');
      const b = typography('b');
      const c = typography('c');
      expect(insertAt([a, c], 1, b)).toEqual([a, b, c]);
    });

    it('clamps negative index to start and overflow to end', () => {
      const a = typography('a');
      const b = typography('b');
      expect(insertAt([a], -5, b)).toEqual([b, a]);
      expect(insertAt([a], 99, b)).toEqual([a, b]);
    });
  });

  describe('removeById', () => {
    it('removes top-level node', () => {
      const a = typography('a');
      const b = typography('b');
      expect(removeById([a, b], 'a')).toEqual([b]);
    });

    it('removes nested node', () => {
      const inner = typography('inner');
      const root = container('root', [inner]);
      expect(removeById([root], 'inner')).toEqual([container('root', [])]);
    });

    it('no-op when id missing', () => {
      const a = typography('a');
      expect(removeById([a], 'nope')).toEqual([a]);
    });
  });

  describe('updateById', () => {
    it('patches a top-level node', () => {
      const a = typography('a', 'old');
      const updated = updateById([a], 'a', (n) =>
        n.type === 'typography' ? { ...n, props: { ...n.props, text: 'new' } } : n,
      );
      expect((updated[0] as TypographyBlock).props.text).toBe('new');
    });

    it('patches nested node inside container', () => {
      const inner = typography('inner', 'old');
      const root = container('root', [inner]);
      const updated = updateById([root], 'inner', (n) =>
        n.type === 'typography' ? { ...n, props: { ...n.props, text: 'new' } } : n,
      );
      expect(
        ((updated[0] as ContainerBlock).children[0] as TypographyBlock).props.text,
      ).toBe('new');
    });
  });

  describe('moveById', () => {
    it('reorders two top-level nodes', () => {
      const a = typography('a');
      const b = typography('b');
      const c = typography('c');
      expect(moveById([a, b, c], 'a', 'c')).toEqual([b, c, a]);
    });

    it('returns the same array when ids are absent', () => {
      const a = typography('a');
      const b = typography('b');
      expect(moveById([a, b], 'a', 'missing')).toEqual([a, b]);
    });
  });

  describe('multilingual text helpers', () => {
    it('toMultilingual lifts string into { hy, ru, en }', () => {
      expect(toMultilingual('hi')).toEqual({ hy: 'hi', ru: '', en: '' });
    });

    it('toMultilingual is a no-op for objects', () => {
      const m = { hy: 'a', ru: 'b', en: 'c' };
      expect(toMultilingual(m)).toBe(m);
    });

    it('toPlainText prefers hy, then ru, then en', () => {
      expect(toPlainText('hi')).toBe('hi');
      expect(toPlainText({ hy: 'a', ru: 'b', en: 'c' })).toBe('a');
      expect(toPlainText({ hy: '', ru: 'b', en: 'c' })).toBe('b');
      expect(toPlainText({ hy: '', ru: '', en: 'c' })).toBe('c');
      expect(toPlainText({ hy: '', ru: '', en: '' })).toBe('');
    });
  });

  describe('block factories', () => {
    it('makeTypographyBlock has h2 default and plain text', () => {
      const b = makeTypographyBlock();
      expect(b.type).toBe('typography');
      expect(b.props.variant).toBe('h2');
      expect(b.props.multilingual).toBe(false);
      expect(typeof b.props.text).toBe('string');
    });

    it('makeFieldBlock embeds a FieldDef matching the block id', () => {
      const b = makeFieldBlock('text');
      expect(b.type).toBe('field');
      expect(b.props.field.id).toBe(b.id);
      expect(b.props.field.type).toBe('text');
    });

    it('makeContainerBlock starts empty', () => {
      const b = makeContainerBlock();
      if (b.type !== 'container') throw new Error('expected container');
      expect(b.children).toEqual([]);
    });
  });
});
