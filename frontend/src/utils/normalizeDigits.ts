export function normalizeDigits(str: string): string {
  if (!str) return '';
  const fa = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(str)
    .replace(/[۰-۹]/g, (w) => String(fa.indexOf(w)))
    .replace(/[٠-٩]/g, (w) => String(ar.indexOf(w)))
    .trim();
}
