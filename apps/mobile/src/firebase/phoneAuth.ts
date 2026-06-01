/** Firebase Phone Auth needs E.164 format (+972501234567). */
export function toE164(phone: string): string {
  const trimmed = (phone ?? '').trim();
  if (!trimmed) return '';

  const digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('972')) {
    return `+${digits}`;
  }

  if (digits.startsWith('0')) {
    return `+972${digits.slice(1)}`;
  }

  if (digits.length === 9 && digits.startsWith('5')) {
    return `+972${digits}`;
  }

  return `+${digits}`;
}
