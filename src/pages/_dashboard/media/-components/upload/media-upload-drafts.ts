import type { UploadMediaInput } from '@/api/endpoints/media.api';

export interface MediaUploadDraft {
  key: string;
  file: File;
  fileName: string;
}

function stripFileExtension(name: string): string {
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex <= 0) {
    return name;
  }
  return name.slice(0, lastDotIndex);
}

export function createUploadDrafts(files: File[]): MediaUploadDraft[] {
  return files.map((file, index) => ({
    key: `${file.name}::${index}`,
    file,
    fileName: stripFileExtension(file.name),
  }));
}

export function setUploadDraftName(
  drafts: MediaUploadDraft[],
  key: string,
  nextName: string,
): MediaUploadDraft[] {
  return drafts.map(draft => draft.key === key ? { ...draft, fileName: nextName } : draft);
}

export function toUploadMediaInput(draft: MediaUploadDraft, currentPath: string): UploadMediaInput {
  return {
    file: draft.file,
    folder: currentPath,
    fileName: draft.fileName.trim() || undefined,
  };
}
