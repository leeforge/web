import { describe, expect, it } from 'bun:test';
import {
  createUploadDrafts,
  setUploadDraftName,
  toUploadMediaInput,
} from './media-upload-drafts';

describe('media upload drafts', () => {
  it('creates drafts and preserves default file names', () => {
    const file = new File(['body'], 'origin.png', { type: 'image/png' });
    const drafts = createUploadDrafts([file]);
    expect(drafts[0].fileName).toBe('origin');
  });

  it('builds create-upload payload without thumbnail fields', () => {
    const file = new File(['body'], 'origin.png', { type: 'image/png' });
    const [draft] = setUploadDraftName(createUploadDrafts([file]), 'origin.png::0', 'hero-banner');

    expect(toUploadMediaInput(draft, '/products')).toEqual({
      file,
      folder: '/products',
      fileName: 'hero-banner',
    });
  });

  it('creates unique draft keys when files have duplicate names', () => {
    const files = [
      new File(['a'], 'same-name.png', { type: 'image/png' }),
      new File(['b'], 'same-name.png', { type: 'image/png' }),
    ];
    const drafts = createUploadDrafts(files);
    expect(new Set(drafts.map(draft => draft.key)).size).toBe(2);
  });
});
