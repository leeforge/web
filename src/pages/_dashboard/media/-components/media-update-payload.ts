interface MediaUpdateFormValues {
  name?: string;
  alternativeText?: string;
  caption?: string;
  folderPath?: string;
}

export function buildMediaUpdatePayload(values: MediaUpdateFormValues, thumbnail?: File) {
  return {
    name: values.name?.trim() || undefined,
    alternativeText: values.alternativeText,
    caption: values.caption,
    folderPath: values.folderPath,
    thumbnail,
  };
}
