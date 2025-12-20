# Phone Number Digit Limit - Quick Reference

## What Changed?

The phone input fields in Lead Management now **automatically enforce country-specific digit limits**. 

### Before:
- Users could enter any number of digits (e.g., +91 with 15 digits)
- No restriction on excess digits
- Manual validation only on form submit

### After:
- System detects country code from phone number
- **Auto-truncates excess digits** to country's limit
- Real-time validation shows detected country
- E.164 format (international standard): `+CCNNNNNNNNN`

---

## How It Works

### Example 1: India (+91) - Maximum 10 Digits

```
User enters:  +919876543210123  (15 digits after +91)
System shows: +919876543210     (auto-truncated to 10 digits)
Message:      ✓ Valid phone number (IN: 10 digits)
```

### Example 2: USA (+1) - Maximum 10 Digits

```
User enters:  +14155552671999   (11 digits after +1)
System shows: +14155552671      (auto-truncated to 10 digits)
Message:      ✓ Valid phone number (US: 10 digits)
```

### Example 3: Singapore (+65) - Maximum 8 Digits

```
User enters:  +6591234567890    (11 digits after +65)
System shows: +65912345         (auto-truncated to 8 digits)
Message:      ✓ Valid phone number (SG: 8 digits)
```

---

## Supported Countries

| Country | Code | Max Digits | Example |
|---------|------|------------|---------|
| India | IN | 10 | +919876543210 |
| USA | US | 10 | +14155552671 |
| Canada | CA | 10 | +14165551234 |
| UK | GB | 10 | +441632960008 |
| Australia | AU | 9 | +61412345678 |
| Germany | DE | 11 | +491234567890 |
| France | FR | 9 | +33123456789 |
| China | CN | 11 | +8610123456789 |
| Brazil | BR | 11 | +551198765432 |
| Japan | JP | 10 | +81312345678 |
| Mexico | MX | 10 | +525512345678 |
| Singapore | SG | 8 | +6591234567 |
| UAE | AE | 9 | +971501234567 |
| Pakistan | PK | 10 | +923001234567 |
| Bangladesh | BD | 10 | +8801712345678 |
| ... and 75+ more countries | ... | ... | ... |

---

## Usage Instructions

### In Lead Management Form:

1. **Open Add New Lead dialog**

2. **Go to "Organization & Clinician" section**
   - Enter Clinician Name
   - Enter Clinician Email
   
3. **Fill Clinician Phone:**
   ```
   ┌─────────────────────────────────┐
   │ [🇮🇳 +91] [input field]        │
   └─────────────────────────────────┘
   - Click field
   - Select country from dropdown (or it auto-detects from +CC)
   - Type phone number
   - System restricts to country's digit count
   - Green checkmark appears when valid
   ```

4. **Go to "Patient Details" section**
   - Same process for Patient Phone

5. **Submit Form**
   - All phone numbers are validated
   - Excess digits already removed
   - Format: E.164 standard (international)

---

## What Gets Stored

Phone numbers are stored in **E.164 format** (international standard):

```
Format: +CCNNNNNNNNN

Examples:
+919876543210     (India: country code 91 + 10 digits)
+14155552671      (USA: country code 1 + 10 digits)
+441632960008     (UK: country code 44 + 10 digits)
+65912345         (Singapore: country code 65 + 8 digits)
```

---

## Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User enters phone number in field                           │
├─────────────────────────────────────────────────────────────┤
│ restrictPhoneInput() checks:                                │
│  1. Extract country code (+91, +1, +44, etc.)              │
│  2. Look up digit limit for that country                    │
│  3. Truncate to max digits if exceeded                      │
│  4. Return E.164 format                                     │
├─────────────────────────────────────────────────────────────┤
│ Form updates with formatted value                           │
│ → Field shows: +919876543210                               │
│ → Success msg: ✓ Valid phone number (IN: 10 digits)        │
├─────────────────────────────────────────────────────────────┤
│ On form submission:                                         │
│  - Final validation ensures exact digit count              │
│  - Phone number is stored in database                       │
│  - Lead is created ✓                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

✅ **Auto-Detection**
   - Country detected automatically from phone value
   - Works with any country code

✅ **Auto-Truncation**
   - Excess digits removed automatically
   - No annoying "too many characters" errors
   - User-friendly UX

✅ **Real-Time Feedback**
   - Green checkmark when valid
   - Shows detected country: "✓ Valid phone number (IN: 10 digits)"
   - Red error if invalid

✅ **90+ Countries**
   - Pre-configured digit limits for each country
   - Easy to add more countries

✅ **International Standard**
   - E.164 format (globally recognized)
   - Works with all phone systems

---

## Troubleshooting

### Q: User pastes a number with too many digits
**A:** System auto-truncates to country's limit. No error shown.

Example:
```
Paste: +919876543210123456
Shows: +919876543210
Auto-truncated to 10 digits ✓
```

### Q: User enters number without country code
**A:** Field uses default country (India +91). User should select correct country.

### Q: User enters invalid number format
**A:** Validation error appears in red below field. Cannot submit until fixed.

### Q: Can I change the digit limit for a country?
**A:** Yes, edit `PHONE_DIGIT_MAP` in `/client/src/utils/phoneValidation.ts`

---

## For Developers

### Check Digit Limit:
```typescript
import { getExpectedDigitCount } from "@/utils/phoneValidation";

const limit = getExpectedDigitCount('IN');  // Returns: 10
const limit = getExpectedDigitCount('SG');  // Returns: 8
```

### Get Detected Country:
```typescript
import { getDetectedCountryCode } from "@/utils/phoneValidation";

const country = getDetectedCountryCode('+919876543210');  // Returns: 'IN'
const country = getDetectedCountryCode('+14155552671');   // Returns: 'US'
```

### Restrict Phone Input:
```typescript
import { restrictPhoneInput } from "@/utils/phoneValidation";

// Auto-detects country and truncates
const clean = restrictPhoneInput('+919876543210123456');
// Returns: '+919876543210' (auto-truncated to 10 digits)
```

---

## Implementation Details

**Files Modified:**
1. `/client/src/utils/phoneValidation.ts`
   - Enhanced `restrictPhoneInput()` function
   - Added country code numeric map
   - Added `getDetectedCountryCode()` export

2. `/client/src/pages/LeadManagement.tsx`
   - Updated both phone input handlers
   - Added country/digit display in success messages
   - Updated imports

**Testing:**
- Test with India (+91) - 10 digits max
- Test with USA (+1) - 10 digits max
- Test with Singapore (+65) - 8 digits max
- Test pasting excess digits - should auto-truncate
- Test validation error on submit if digits wrong

---

## Questions?

The system now ensures:
✓ India: +91 with exactly 10 digits (e.g., +919876543210)
✓ USA: +1 with exactly 10 digits (e.g., +14155552671)
✓ Any country: Auto-detects and enforces limit
✓ Auto-truncates excess digits
✓ Shows user which country/digit count detected
