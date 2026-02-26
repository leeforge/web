import { describe, expect, it } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import type { MediaNode } from '@/api/endpoints/media.api';
import { MediaDndGrid } from './MediaDndGrid';

describe('MediaDndGrid', () => {
  it('renders folder drop targets', () => {
    const nodes: MediaNode[] = [
      { kind: 'folder', id: 'f-1', name: 'A', path: '/a' },
      { kind: 'file', id: 'm-1', name: 'a.png', url: '/a.png' },
    ] as MediaNode[];

    const html = renderToStaticMarkup(
      <MediaDndGrid
        nodes={nodes}
        loading={false}
        selectedNodeIds={[]}
        onSelectNode={() => {}}
        onOpenNode={() => {}}
        onDropMove={() => {}}
      />,
    );

    expect(html).toContain('data-drop-target="folder:f-1"');
  });
});
