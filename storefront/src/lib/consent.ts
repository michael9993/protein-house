const CONSENT_KEY_PREFIX = "aura_cookie_consent_";
const CONSENT_VERSION = 1;

export type ConsentCategories = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
};

type ConsentState = {
  categories: ConsentCategories;
  timestamp: number;
  version: number;
};

export function getConsentState(channel: string): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY_PREFIX + channel);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function saveConsent(
  channel: string,
  categories: Omit<ConsentCategories, "essential">,
  expiryDays: number,
): void {
  const state: ConsentState = {
    categories: { essential: true, ...categories },
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(CONSENT_KEY_PREFIX + channel, JSON.stringify(state));
  window.dispatchEvent(
    new CustomEvent("consent-updated", { detail: state.categories }),
  );
}

export function hasConsent(
  channel: string,
  category: keyof ConsentCategories,
  expiryDays = 365,
): boolean {
  const state = getConsentState(channel);
  if (!state) return false;
  const expiryMs = expiryDays * 24 * 60 * 60 * 1000;
  if (Date.now() - state.timestamp > expiryMs) return false;
  return state.categories[category] ?? false;
}

export function hasAnyConsent(channel: string): boolean {
  return getConsentState(channel) !== null;
}

export function clearConsent(channel: string): void {
  localStorage.removeItem(CONSENT_KEY_PREFIX + channel);
}
