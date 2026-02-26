import { describe, expect, it } from 'bun:test';
import { buildMediaUpdatePayload } from './media-update-payload';

describe('buildMediaUpdatePayload', () => {
  it('builds drawer update payload with thumbnail and contract fields', () => {
    const thumb = new File(['thumb'], 'thumb.png', { type: 'image/png' });

    expect(buildMediaUpdatePayload({
      name: ' hero.jpg ',
      alternative_text: 'hero alt',
      caption: 'hero caption',
      folder_path: '/products/iphone',
    }, thumb)).toEqual({
      name: 'hero.jpg',
      alternative_text: 'hero alt',
      caption: 'hero caption',
      folder_path: '/products/iphone',
      thumbnail: thumb,
    });
  });
});
