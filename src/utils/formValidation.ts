export function hasFormControlCharacters(value: string, multiline = false): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code === 127 || (code < 32 && !(multiline && [9, 10, 13].includes(code)))) return true;
  }
  return false;
}

export function isValidFormEmail(value: string): boolean {
  if (value.length > 254 || hasFormControlCharacters(value)) return false;
  const parts = value.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local.length > 64 || !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(local)) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && /^[a-z][a-z0-9-]*[a-z0-9]$/.test(labels[labels.length - 1])
    && labels.every((label) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label));
}

export function isValidFormName(value: string): boolean {
  return value.trim().length >= 2 && value.length <= 120 && !hasFormControlCharacters(value);
}
