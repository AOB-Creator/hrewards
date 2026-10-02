/** +998 XX XXX XX XX or any international E.164 number. */
export function normalizePhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return '+' + digits.slice(1).replace(/\+/g, '');
  if (digits.startsWith('998')) return '+' + digits;
  if (digits.length === 9) return '+998' + digits;
  return '+' + digits;
}

export function isValidPhone(input: string): boolean {
  const p = normalizePhone(input);
  if (p.startsWith('+998')) return /^\+998\d{9}$/.test(p);
  return /^\+\d{8,15}$/.test(p);
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.trim());
}

export function formatPhone(p: string): string {
  const n = normalizePhone(p);
  const m = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(n);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : n;
}
