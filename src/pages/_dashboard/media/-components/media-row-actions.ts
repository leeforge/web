export function getMediaRowActionLabels(kind: 'folder' | 'file'): string[] {
  if (kind === 'folder') {
    return ['进入', '重命名/移动', '删除目录'];
  }
  return ['详情', '删除'];
}
