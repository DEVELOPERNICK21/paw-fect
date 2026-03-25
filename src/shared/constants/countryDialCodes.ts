export interface CountryDialOption {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
}

/** Curated list for picker; dial codes without duplicates per row where possible. */
export const COUNTRY_DIAL_OPTIONS: CountryDialOption[] = [
  { iso: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { iso: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { iso: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { iso: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { iso: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { iso: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { iso: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { iso: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { iso: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
  { iso: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { iso: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { iso: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { iso: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { iso: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { iso: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { iso: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { iso: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { iso: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { iso: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { iso: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { iso: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭' },
  { iso: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { iso: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { iso: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { iso: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
  { iso: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿' },
  { iso: 'IE', name: 'Ireland', dialCode: '+353', flag: '🇮🇪' },
  { iso: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { iso: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
];

export const DEFAULT_COUNTRY = COUNTRY_DIAL_OPTIONS[0];

export function dialCodeDigits(dialCode: string): string {
  return dialCode.replace(/\D/g, '');
}

export function formatNationalForDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.length === 10) {
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }
  return d.replace(/(\d{3})(?=\d)/g, '$1 ').trim() || d;
}
