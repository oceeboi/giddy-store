import { CurrencyFormatterBase } from '@/packages/format-currency';

function format_currency(amount: number): string {
  CurrencyFormatterBase.setDefaultCountry('Nigeria');
  return CurrencyFormatterBase.format(amount);
}

export function parseCsvInput(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function trimToUndefined(value: string | null | undefined) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function trimToNull(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeStringArray(values: string[] | undefined) {
  if (!values) return [];
  const nextValues = values.map((value) => value.trim()).filter(Boolean);
  return [...new Set(nextValues)];
}

export { format_currency };
