# Phone Number Validation with Country-Specific Digit Count

## Overview
This feature implements phone number validation in the Lead Management form that enforces country-specific digit count restrictions. For example, Indian phone numbers (+91) must have exactly 10 digits, US numbers (+1) must have 10 digits, etc.

## Components

### 1. Utility File: `client/src/utils/phoneValidation.ts`
Contains all phone validation logic and country-to-digit mapping.

**Key Functions:**

- `getCountryCodeFromPhoneString(phoneNumber: string)`: Extracts the country code (e.g., "IN", "US") from a phone number string.

- `extractDigits(value: string)`: Removes all non-digit characters from a phone string.

- `getNationalDigits(phoneNumber: string)`: Extracts only the national number digits without the country code.

- `getExpectedDigitCount(countryCode: string | null)`: Returns the expected number of digits for a given country code.

- `validatePhoneDigitCount(phoneNumber: string)`: Validates if the phone number has the correct digit count for its country.

**Supported Countries:**
Currently supports 70+ countries including:
- India (IN): 10 digits
- United States (US): 10 digits
- United Kingdom (GB): 10 digits
- Australia (AU): 9 digits
- Germany (DE): 11 digits
- Japan (JP): 10 digits
- Brazil (BR): 11 digits
- And many more...

### 2. LeadManagement.tsx Updates

**Schema Validation:**
Updated the Zod schema for both `clinicianResearcherPhone` and `patientClientPhone` fields to include digit count validation using `superRefine()`:

```typescript
clinicianResearcherPhone: z.string()
  .min(1, "Clinician phone number is required")
  .refine((phone) => isValidPhoneNumber(phone), "Please enter a valid international phone number")
  .superRefine((phone, ctx) => {
    const validation = validatePhoneDigitCount(phone);
    if (!validation.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validation.message
      });
    }
  })
```

**Form Input Handling:**
All PhoneInput components now include:
1. Real-time validation triggering
2. Success indicator (green checkmark) when phone is valid
3. Error messages showing the exact digit count requirement

```typescript
onChange={(value) => {
  const phoneValue = value || '';
  form.setValue('clinicianResearcherPhone', phoneValue);
  if (phoneValue) {
    form.trigger('clinicianResearcherPhone');
  }
}}
```

## How It Works

### Example: Indian Phone Number
1. User selects "India +91" from the country selector
2. User enters: `+91 98765 43210` (displays as formatted: +91 98765 43210)
3. Validation extracts:
   - Country code: "IN"
   - National digits: `9876543210` (10 digits)
4. Expected digits for India: 10
5. **Result**: ✓ Valid (matches exactly)

### Example: Invalid Entry
1. User enters: `+91 9876 54321` (11 digits instead of 10)
2. National digits: `98765432`1 (11 digits)
3. Expected: 10 digits
4. **Result**: ✗ Error message: "IN phone numbers must have exactly 10 digits, but got 11"

## Validation Points

Validation occurs at:
1. **On Change**: When user modifies the phone input, validation is triggered
2. **On Blur**: Validation is triggered when user leaves the field (mode: 'onBlur')
3. **On Submit**: Final validation before form submission

## Error Messages

Users see specific error messages for:
- Missing phone number: "Phone number is required"
- Invalid format: "Please enter a valid international phone number"
- Wrong digit count: "[COUNTRY] phone numbers must have exactly [X] digits, but got [Y]"

## Success Indicator

When a phone number is valid:
- ✓ Green checkmark appears below the input field
- No error messages displayed
- Form can be submitted

## Supported Phone Number Formats

The PhoneInput component supports multiple formats:
- `+91 98765 43210` (with spaces)
- `+919876543210` (without spaces)
- `+91-98765-43210` (with dashes)

All are normalized and validated correctly.

## Testing Scenarios

### Test Case 1: India
**Input**: `+91 98765 43210`
**Expected**: Valid (10 digits)
**Result**: ✓ Success indicator shows

### Test Case 2: United States
**Input**: `+1 555 123 4567`
**Expected**: Valid (10 digits)
**Result**: ✓ Success indicator shows

### Test Case 3: Invalid Indian Number
**Input**: `+91 9876 5432` (9 digits instead of 10)
**Expected**: Invalid
**Result**: Error message: "IN phone numbers must have exactly 10 digits, but got 9"

### Test Case 4: Invalid Indian Number
**Input**: `+91 9876 5432 10` (11 digits instead of 10)
**Expected**: Invalid
**Result**: Error message: "IN phone numbers must have exactly 10 digits, but got 11"

## Adding New Countries

To add a new country or update digit count:

1. Edit `PHONE_DIGIT_MAP` in `phoneValidation.ts`:
```typescript
export const PHONE_DIGIT_MAP: Record<string, number> = {
  // ... existing countries
  XX: 10, // Your Country Name
};
```

2. Update `countryCodeMap` in `getCountryCodeFromPhoneString()` to include the numeric country code mapping:
```typescript
const countryCodeMap: Record<string, string> = {
  // ... existing mappings
  '123': 'XX', // Numeric code to country code
};
```

3. Update numeric mapping in `getNationalDigits()` function similarly.

## Implementation Details

### Why SuperRefine?
- `refine()` with `message` function doesn't support async operations
- `superRefine()` provides better control for custom validations
- Allows adding issues with specific codes and messages

### Digit Count Validation Strategy
1. Parse phone number to extract country code
2. Extract national number (digits without country code)
3. Compare against expected count for that country
4. Return specific error with country code, expected, and actual digits

## Browser Compatibility

Works on all modern browsers that support:
- ES6 JavaScript
- React 18+
- Zod validation library

## Performance

- Validation is instant (no async operations)
- No external API calls
- All country mappings are static and included in the bundle
