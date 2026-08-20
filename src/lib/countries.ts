export const SUPPORTED_COUNTRIES = [
  {
    name: "United Kingdom",
    code: "GB",
    dialCode: "+44",
    phonePlaceholder: "07911123456",
    phoneHint: "11 digits, starting with 07",
  },
  {
    name: "Nigeria",
    code: "NG",
    dialCode: "+234",
    phonePlaceholder: "08012345678",
    phoneHint: "11 digits, starting with 0",
  },
] as const;

export type SupportedCountryName = (typeof SUPPORTED_COUNTRIES)[number]["name"];

export function getCountryByName(name: string) {
  return SUPPORTED_COUNTRIES.find((c) => c.name === name);
}

/** Strip to digits only, cap at 11 characters. */
export function normalizeLocalPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function isValidLocalPhone(phone: string, countryName?: string): boolean {
  if (!/^\d{11}$/.test(phone)) return false;

  const country = countryName ? getCountryByName(countryName) : undefined;
  if (country?.code === "GB") {
    return /^07\d{9}$/.test(phone);
  }
  if (country?.code === "NG") {
    return /^0[789]\d{9}$/.test(phone);
  }

  return /^0\d{10}$/.test(phone);
}

export function formatPhoneValidationMessage(countryName?: string): string {
  const country = countryName ? getCountryByName(countryName) : undefined;
  if (country?.code === "GB") {
    return "Enter a valid UK mobile number (11 digits, e.g. 07911123456)";
  }
  if (country?.code === "NG") {
    return "Enter a valid Nigerian number (11 digits, e.g. 08012345678)";
  }
  return "Phone number must be exactly 11 digits";
}
