import { parsePhoneNumberFromString } from "libphonenumber-js";

/**
 * Calling codes aligned with registration UI country dropdown (prefix without +).
 * Used to pick a default country when parsing international numbers.
 */
const CALLING_CODE_TO_COUNTRY = {
  "1": "US",
  "20": "EG",
  "27": "ZA",
  "44": "GB",
  "91": "IN",
  "234": "NG",
  "251": "ET",
  "254": "KE",
};

function digitsOnly(input) {
  return input.replace(/\D/g, "");
}

function inferCountryFromDigits(d) {
  if (!d) return null;
  const codes = Object.keys(CALLING_CODE_TO_COUNTRY).sort(
    (a, b) => b.length - a.length,
  );
  for (const code of codes) {
    if (d.startsWith(code) && d.length > code.length) {
      return CALLING_CODE_TO_COUNTRY[code];
    }
  }
  return null;
}

function tryParsedNumber(parsed) {
  if (!parsed) return null;
  if (parsed.isValid()) return parsed.number;
  if (typeof parsed.isPossible === "function" && parsed.isPossible()) {
    return parsed.number;
  }
  return null;
}

/**
 * If input already looks like E.164 (+ and 10–15 digits), accept it when
 * libphonenumber is overly strict (common with some national formats).
 */
function looseE164(trimmed) {
  const compact = trimmed.replace(/\s/g, "");
  if (!/^\+\d{10,15}$/.test(compact)) return null;
  return compact;
}

/**
 * Normalize to E.164 using libphonenumber-js, with pragmatic fallbacks.
 * @param {string} input - Raw phone string from the client
 * @param {string} defaultCountry - ISO 3166-1 alpha-2 (e.g. US, ET)
 */
export function normalizePhoneNumber(input, defaultCountry = "US") {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const compactNoSpace = trimmed.replace(/\s/g, "");

  for (const candidate of [trimmed, compactNoSpace]) {
    const parsed = parsePhoneNumberFromString(candidate, defaultCountry);
    const n = tryParsedNumber(parsed);
    if (n) return n;
  }

  const inferred = inferCountryFromDigits(digitsOnly(trimmed));
  if (inferred) {
    const intl = compactNoSpace.startsWith("+")
      ? compactNoSpace
      : `+${digitsOnly(trimmed)}`;
    const parsedIntl = parsePhoneNumberFromString(intl, inferred);
    const n = tryParsedNumber(parsedIntl);
    if (n) return n;
  }

  const loose = looseE164(trimmed);
  if (loose) return loose;

  return null;
}
