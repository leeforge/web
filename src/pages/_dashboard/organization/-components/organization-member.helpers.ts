export function buildAddMemberPayload(userId: string, isPrimary: boolean) {
  return {
    userId: userId.trim(),
    isPrimary,
  };
}
