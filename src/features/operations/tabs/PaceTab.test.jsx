import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import PaceTab from './PaceTab';

describe('PaceTab', () => {
  it('renders meaningful pace and conversion insight content', () => {
    const html = renderToStaticMarkup(<PaceTab />);
    expect(html).toContain('Slow Round Rate');
    expect(html).toContain('Round Duration Distribution');
    expect(html).toContain('Key insight');
    expect(html).toContain('dining conversion');
  });
});
