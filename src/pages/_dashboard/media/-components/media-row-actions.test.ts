import { describe, expect, it } from 'bun:test';
import { getMediaRowActionLabels } from './media-row-actions';

describe('getMediaRowActionLabels', () => {
  it('returns unique action labels for folder rows', () => {
    expect(getMediaRowActionLabels('folder')).toEqual(['进入', '重命名/移动', '删除目录']);
  });

  it('returns unique action labels for file rows', () => {
    expect(getMediaRowActionLabels('file')).toEqual(['详情', '删除']);
  });
});
