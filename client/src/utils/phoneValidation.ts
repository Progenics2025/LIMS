// Mapping of countries to their phone number digit counts (without country code)
export const PHONE_DIGIT_MAP: Record<string, number> = {
  IN: 10, // India
  US: 10, // United States
  GB: 10, // United Kingdom
  CA: 10, // Canada
  AU: 9,  // Australia
  DE: 11, // Germany
  FR: 9,  // France
  IT: 10, // Italy
  ES: 9,  // Spain
  JP: 10, // Japan
  CN: 11, // China
  BR: 11, // Brazil
  MX: 10, // Mexico
  SG: 8,  // Singapore
  AE: 9,  // United Arab Emirates
  NZ: 9,  // New Zealand
  ZA: 9,  // South Africa
  NG: 10, // Nigeria
  KE: 9,  // Kenya
  PH: 10, // Philippines
  TH: 9,  // Thailand
  MY: 10, // Malaysia
  ID: 10, // Indonesia
  PK: 10, // Pakistan
  BD: 10, // Bangladesh
  LK: 9,  // Sri Lanka
  VN: 9,  // Vietnam
  TW: 9,  // Taiwan
  HK: 8,  // Hong Kong
  KR: 10, // South Korea
  RU: 10, // Russia
  UA: 9,  // Ukraine
  PL: 9,  // Poland
  CZ: 9,  // Czech Republic
  HU: 9,  // Hungary
  RO: 10, // Romania
  GR: 10, // Greece
  PT: 9,  // Portugal
  NL: 9,  // Netherlands
  BE: 9,  // Belgium
  SE: 9,  // Sweden
  NO: 8,  // Norway
  DK: 8,  // Denmark
  FI: 9,  // Finland
  IE: 10, // Ireland
  CH: 9,  // Switzerland
  AT: 10, // Austria
  IL: 9,  // Israel
  SA: 9,  // Saudi Arabia
  CL: 9,  // Chile
  CO: 10, // Colombia
  AR: 10, // Argentina
  PE: 9,  // Peru
  VE: 10, // Venezuela
  EC: 9,  // Ecuador
  BO: 8,  // Bolivia
  PY: 10, // Paraguay
  UY: 10, // Uruguay
  TR: 10, // Turkey
  EG: 10, // Egypt
};

/**
 * Get country code from a phone value (auto-detect from phone number)
 * Useful for displaying which country is currently selected
 */
export function getDetectedCountryCode(phoneValue: string | undefined | null): string | null {
  if (!phoneValue) return null;
  return getCountryCodeFromPhoneString(phoneValue);
}

/**
 * Get country code from phone number string
 * E.g., "+91 98765 43210" -> "IN"
 */
export function getCountryCodeFromPhoneString(phoneNumber: string | undefined | null): string | null {
  if (!phoneNumber) return null;
  
  // Remove all non-digits and + from the string
  const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it starts with country code format
  if (!cleanedNumber.startsWith('+')) return null;
  
  // Common country codes mapping for quick lookup
  const countryCodeMap: Record<string, string> = {
    '1': 'US',   // US/Canada
    '91': 'IN',  // India
    '44': 'GB',  // United Kingdom
    '61': 'AU',  // Australia
    '49': 'DE',  // Germany
    '33': 'FR',  // France
    '39': 'IT',  // Italy
    '34': 'ES',  // Spain
    '81': 'JP',  // Japan
    '86': 'CN',  // China
    '55': 'BR',  // Brazil
    '52': 'MX',  // Mexico
    '65': 'SG',  // Singapore
    '971': 'AE', // UAE
    '64': 'NZ',  // New Zealand
    '27': 'ZA',  // South Africa
    '234': 'NG', // Nigeria
    '254': 'KE', // Kenya
    '63': 'PH',  // Philippines
    '66': 'TH',  // Thailand
    '60': 'MY',  // Malaysia
    '62': 'ID',  // Indonesia
    '92': 'PK',  // Pakistan
    '880': 'BD', // Bangladesh
    '94': 'LK',  // Sri Lanka
    '84': 'VN',  // Vietnam
    '886': 'TW', // Taiwan
    '852': 'HK', // Hong Kong
    '82': 'KR',  // South Korea
    '7': 'RU',   // Russia
    '380': 'UA', // Ukraine
    '48': 'PL',  // Poland
    '420': 'CZ', // Czech Republic
    '36': 'HU',  // Hungary
    '40': 'RO',  // Romania
    '30': 'GR',  // Greece
    '351': 'PT', // Portugal
    '31': 'NL',  // Netherlands
    '32': 'BE',  // Belgium
    '46': 'SE',  // Sweden
    '47': 'NO',  // Norway
    '45': 'DK',  // Denmark
    '358': 'FI', // Finland
    '353': 'IE', // Ireland
    '41': 'CH',  // Switzerland
    '43': 'AT',  // Austria
    '972': 'IL', // Israel
    '966': 'SA', // Saudi Arabia
    '56': 'CL',  // Chile
    '57': 'CO',  // Colombia
    '54': 'AR',  // Argentina
    '51': 'PE',  // Peru
    '58': 'VE',  // Venezuela
    '593': 'EC', // Ecuador
    '591': 'BO', // Bolivia
    '595': 'PY', // Paraguay
    '598': 'UY', // Uruguay
    '90': 'TR',  // Turkey
    '20': 'EG',  // Egypt
  };
  
  // Try to find matching country code (longest match first)
  for (let len = 3; len >= 1; len--) {
    const code = cleanedNumber.substring(1, len + 1);
    if (countryCodeMap[code]) {
      return countryCodeMap[code];
    }
  }
  
  return null;
}

/**
 * Extract only digits from a phone number string
 */
export function extractDigits(value: string | undefined | null): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

/**
 * Get the expected number of digits for a given country code
 */
export function getExpectedDigitCount(countryCode: string | null): number | null {
  if (!countryCode) return null;
  return PHONE_DIGIT_MAP[countryCode] || null;
}

/**
 * Get national number digits from a phone string
 * E.g., "+91 98765 43210" -> "9876543210"
 */
export function getNationalDigits(phoneNumber: string | undefined | null): string {
  if (!phoneNumber) return '';
  
  const allDigits = extractDigits(phoneNumber);
  
  // If it's just digits (no country code), return as-is
  if (!phoneNumber.includes('+')) {
    return allDigits;
  }
  
  // Extract country code and return remaining digits
  const countryCode = getCountryCodeFromPhoneString(phoneNumber);
  
  if (!countryCode) return allDigits;
  
  // For country code lookups, we need the actual numeric country code
  const countryCodeMap: Record<string, string> = {
    'US': '1', 'CA': '1', 'IN': '91', 'GB': '44', 'AU': '61', 'DE': '49',
    'FR': '33', 'IT': '39', 'ES': '34', 'JP': '81', 'CN': '86', 'BR': '55',
    'MX': '52', 'SG': '65', 'AE': '971', 'NZ': '64', 'ZA': '27', 'NG': '234',
    'KE': '254', 'PH': '63', 'TH': '66', 'MY': '60', 'ID': '62', 'PK': '92',
    'BD': '880', 'LK': '94', 'VN': '84', 'TW': '886', 'HK': '852', 'KR': '82',
    'RU': '7', 'UA': '380', 'PL': '48', 'CZ': '420', 'HU': '36', 'RO': '40',
    'GR': '30', 'PT': '351', 'NL': '31', 'BE': '32', 'SE': '46', 'NO': '47',
    'DK': '45', 'FI': '358', 'IE': '353', 'CH': '41', 'AT': '43', 'IL': '972',
    'SA': '966', 'CL': '56', 'CO': '57', 'AR': '54', 'PE': '51', 'VE': '58',
    'EC': '593', 'BO': '591', 'PY': '595', 'UY': '598', 'TR': '90', 'EG': '20'
  };
  
  const numericCountryCode = countryCodeMap[countryCode];
  if (!numericCountryCode) return allDigits;
  
  // Remove the country code prefix from the digits
  if (allDigits.startsWith(numericCountryCode)) {
    return allDigits.substring(numericCountryCode.length);
  }
  
  return allDigits;
}

/**
 * Validate if phone number has correct digit count for the country
 */
export function validatePhoneDigitCount(phoneNumber: string | undefined | null): {
  isValid: boolean;
  countryCode: string | null;
  expectedDigits: number | null;
  actualDigits: number;
  message?: string;
} {
  if (!phoneNumber) {
    return {
      isValid: false,
      countryCode: null,
      expectedDigits: null,
      actualDigits: 0,
      message: 'Phone number is required',
    };
  }

  const countryCode = getCountryCodeFromPhoneString(phoneNumber);
  const expectedDigits = countryCode ? getExpectedDigitCount(countryCode) : null;
  const nationalDigits = getNationalDigits(phoneNumber);
  const actualDigits = nationalDigits.length;

  if (!countryCode) {
    return {
      isValid: false,
      countryCode: null,
      expectedDigits: null,
      actualDigits,
      message: 'Could not determine country from phone number',
    };
  }

  if (expectedDigits === null) {
    return {
      isValid: true, // Allow if country is valid but digits count not in our map
      countryCode,
      expectedDigits,
      actualDigits,
    };
  }

  if (actualDigits !== expectedDigits) {
    return {
      isValid: false,
      countryCode,
      expectedDigits,
      actualDigits,
      message: `${countryCode} phone numbers must have exactly ${expectedDigits} digits, but got ${actualDigits}`,
    };
  }

  return {
    isValid: true,
    countryCode,
    expectedDigits,
    actualDigits,
  };
}

/**
 * Format phone number to E.164 format (required by react-phone-number-input)
 * E.164 format: +CCNNNNNNNNN (country code + national number, no spaces)
 */
export function formatToE164(phoneNumber: string | undefined | null): string {
  if (!phoneNumber) return '';

  // Remove all spaces, dashes, parentheses
  const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    return '';
  }

  return cleaned;
}

/**
 * Get numeric country code mapping for all countries
 */
function getCountryCodeNumericMap(): Record<string, string> {
  return {
    'US': '1', 'CA': '1', 'IN': '91', 'GB': '44', 'AU': '61', 'DE': '49',
    'FR': '33', 'IT': '39', 'ES': '34', 'JP': '81', 'CN': '86', 'BR': '55',
    'MX': '52', 'SG': '65', 'AE': '971', 'NZ': '64', 'ZA': '27', 'NG': '234',
    'KE': '254', 'PH': '63', 'TH': '66', 'MY': '60', 'ID': '62', 'PK': '92',
    'BD': '880', 'LK': '94', 'VN': '84', 'TW': '886', 'HK': '852', 'KR': '82',
    'RU': '7', 'UA': '380', 'PL': '48', 'CZ': '420', 'HU': '36', 'RO': '40',
    'GR': '30', 'PT': '351', 'NL': '31', 'BE': '32', 'SE': '46', 'NO': '47',
    'DK': '45', 'FI': '358', 'IE': '353', 'CH': '41', 'AT': '43', 'IL': '972',
    'SA': '966', 'CL': '56', 'CO': '57', 'AR': '54', 'PE': '51', 'VE': '58',
    'EC': '593', 'BO': '591', 'PY': '595', 'UY': '598', 'TR': '90', 'EG': '20'
  };
}

/**
 * Check if adding a digit would exceed the country's limit
 * Returns: { canAdd: boolean, currentDigits: number, maxDigits: number }
 * 
 * Example:
 * - India with +919876543210 (10 digits) + one more = CANNOT ADD
 * - India with +91987654321 (9 digits) + one more = CAN ADD (to reach 10)
 */
export function canAddMoreDigits(
  currentPhoneValue: string | undefined | null,
  newCharacter: string
): { canAdd: boolean; currentDigits: number; maxDigits: number; country: string | null } {
  if (!currentPhoneValue || !newCharacter) {
    return { canAdd: true, currentDigits: 0, maxDigits: 0, country: null };
  }

  // Only consider digit characters
  if (!/\d/.test(newCharacter)) {
    return { canAdd: true, currentDigits: 0, maxDigits: 0, country: null };
  }

  // Get the country code from current phone value
  const countryCode = getCountryCodeFromPhoneString(currentPhoneValue);
  if (!countryCode) {
    // No country detected, allow adding
    return { canAdd: true, currentDigits: 0, maxDigits: 0, country: null };
  }

  // Get max digits for this country
  const maxDigits = getExpectedDigitCount(countryCode);
  if (maxDigits === null) {
    // Country not in our map, allow adding
    return { canAdd: true, currentDigits: 0, maxDigits: 0, country: countryCode };
  }

  // Count current national digits (excluding country code)
  const nationalDigits = getNationalDigits(currentPhoneValue);
  const currentDigits = nationalDigits.length;

  // Check if adding one more digit would exceed the limit
  const canAdd = currentDigits < maxDigits;

  return {
    canAdd,
    currentDigits,
    maxDigits,
    country: countryCode
  };
}

/**
 * Restrict phone number input to max allowed digits for the country
 * Automatically detects country from phone number and enforces digit limit
 * Returns clean E.164 format: +CCNNNNNNNNN (e.g., +919876543210 for India)
 * 
 * Examples:
 * - India: +91 followed by exactly 10 digits
 * - USA: +1 followed by exactly 10 digits
 * - If user pastes +919876543210123, it truncates to +919876543210
 */
export function restrictPhoneInput(
  newValue: string | undefined | null,
  defaultCountry: string = 'IN'
): string {
  if (!newValue) return '';

  // Remove all non-digit characters except +
  let cleaned = newValue.replace(/[^\d\+]/g, '');
  
  const countryCodeNumericMap = getCountryCodeNumericMap();
  const numericCountryCode = countryCodeNumericMap[defaultCountry];
  const expectedDigits = getExpectedDigitCount(defaultCountry);
  
  if (!numericCountryCode || !expectedDigits) return '';

  // Extract all digits
  const allDigits = cleaned.replace(/\D/g, '');
  
  // Try to detect country from the input
  let detectedCountryCode = getCountryCodeFromPhoneString(cleaned);
  let detectedNumericCode = detectedCountryCode ? countryCodeNumericMap[detectedCountryCode] : null;
  let detectedExpectedDigits = detectedCountryCode ? getExpectedDigitCount(detectedCountryCode) : null;
  
  // If we detected a country from the input, use that
  if (detectedNumericCode && detectedExpectedDigits) {
    const ccLength = detectedNumericCode.length;
    const nationalDigits = allDigits.substring(ccLength);
    const truncatedDigits = nationalDigits.substring(0, detectedExpectedDigits);
    return '+' + detectedNumericCode + truncatedDigits;
  }
  
  // Otherwise, use default country
  const nationalDigits = allDigits.substring(numericCountryCode.length);
  const truncatedDigits = nationalDigits.substring(0, expectedDigits);
  
  // Return in E.164 format: +CCNNNNNNNNN (no spaces)
  return '+' + numericCountryCode + truncatedDigits;
}
