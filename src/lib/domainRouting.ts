const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DomainIdentifierInput =
  | string
  | {
      name?: string | null;
      id?: string | null;
    }
  | null
  | undefined;

export function isUuidLike(value: string | null | undefined) {
  return !!value && UUID_PATTERN.test(value.trim());
}

export function safeDecodeDomainIdentifier(value: string | undefined) {
  if (!value) return '';

  try {
    return decodeURIComponent(value).trim();
  } catch {
    return value.trim();
  }
}

export function getDomainIdentifier(input: DomainIdentifierInput) {
  if (typeof input === 'string') {
    const value = input.trim();
    return value || null;
  }

  const value = input?.name?.trim() || input?.id?.trim() || '';
  return value || null;
}

export function getDomainDetailPath(input: DomainIdentifierInput) {
  const identifier = getDomainIdentifier(input);
  return identifier ? `/domain/${encodeURIComponent(identifier)}` : '/marketplace';
}