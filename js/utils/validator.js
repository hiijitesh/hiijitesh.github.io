/**
 * Validator Utility
 * Provides regex-based email validation and temporary/disposable mail blocking.
 */

// Comprehensive regex for standard modern email validation
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Popular disposable / temporary email domains blocklist
export const DISPOSABLE_DOMAINS = new Set([
  // Guerrilla Mail & aliases
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamail.biz', 'guerrillamail.de',
  'guerrillamailblock.com', 'grr.la', 'sharklasers.com', 'pokemail.net', 'spam4.me',
  // Temp Mail & aliases
  'tempmail.com', 'temp-mail.org', 'temp-mail.io', 'tempmail.net', 'tempmail.dev', 'tempail.com', 'tempr.email',
  // Mailinator & aliases
  'mailinator.com', 'mailinator2.com', 'mailin8r.com', 'mailinator.net', 'suremail.info', 'spamherelots.com', 'binkmail.com', 'safetymail.info',
  // 10 Minute Mail
  '10minutemail.com', '10minutemail.net', '10minmail.com', 'minutemail.com', '10minutemail.co.uk',
  // YOPmail & aliases
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'cool.fr.nf', 'jetable.org', 'courriel.fr.nf', 'nospam.ze.tc',
  // Trashmail
  'trashmail.com', 'trashmail.net', 'trashmail.me', 'trashmail.io', 'trashmail.at',
  // Others
  'dispostable.com', 'throwawaymail.com', 'fakeinbox.com', 'fakemailgenerator.com',
  'getnada.com', 'nada.ltd', 'inboxkitten.com', 'mohmal.com', 'crazymailing.com',
  'dropmail.me', 'emailondeck.com', 'generator.email', 'burnermail.io', 'mytemp.email',
  'maildrop.cc', 'harakirimail.com', 'mytempemail.com', 'spamgourmet.com', 'mailcatch.com',
  'mytempemail.com', 'throwaway.email', 'tempinbox.com', 'burner.email', 'getairmail.com'
]);

// Pattern matcher for domain variations containing temp/disposable keywords
const DISPOSABLE_PATTERNS = [
  /temp[-_.]?mail/i,
  /10minute/i,
  /minutemail/i,
  /throwaway/i,
  /dispostable/i,
  /fakeinbox/i,
  /fakemail/i,
  /trashmail/i,
  /guerrillamail/i,
  /sharklasers/i,
  /mailinator/i,
  /yopmail/i,
  /dropmail/i,
  /burnermail/i,
  /inboxkitten/i,
  /mohmal/i,
  /crazymailing/i,
  /emailondeck/i,
  /generator\.email/i,
  /maildrop\.cc/i
];

/**
 * Checks if the given email domain belongs to a disposable/temp mail provider.
 * @param {string} email
 * @returns {boolean}
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;

  const domain = parts[1];

  // Check exact blocklist set
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return true;
  }

  // Check pattern heuristic
  return DISPOSABLE_PATTERNS.some(pattern => pattern.test(domain));
}

/**
 * Detailed email validator returning success status and tailored message.
 * @param {string} email
 * @returns {{ valid: boolean, error?: string, email?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email likhna zaroori hai bhai!' };
  }

  const trimmed = email.trim();

  if (trimmed.length < 5 || trimmed.length > 254 || !EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: 'Bhai, sahi email address likho!' };
  }

  if (isDisposableEmail(trimmed)) {
    return { valid: false, error: 'Bhai, temporary / fake email allowed nahi hai, asli email daalo!' };
  }

  return { valid: true, email: trimmed };
}

/**
 * Quick boolean email validity check.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return validateEmail(email).valid;
}
