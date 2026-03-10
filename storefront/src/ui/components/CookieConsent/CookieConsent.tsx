"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useCookieConsentConfig,
  useCookieConsentText,
  useComponentStyle,
  useComponentClasses,
} from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { hasAnyConsent, saveConsent } from "@/lib/consent";

type View = "banner" | "preferences";

/** Fire-and-forget POST to log consent preferences to user metadata (GDPR audit trail). */
function logConsentToServer(
  channel: string,
  categories: { analytics: boolean; marketing: boolean },
): void {
  fetch("/api/consent-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categories: { essential: true, ...categories },
      channel,
    }),
    credentials: "include",
  }).catch(() => {});
}

export function CookieConsent({ channel }: { channel: string }) {
  const config = useCookieConsentConfig();
  const text = useCookieConsentText();
  const cdStyle = useComponentStyle("ui.cookieConsent");
  const cdClasses = useComponentClasses("ui.cookieConsent");
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<View>("banner");
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  useEffect(() => {
    if (!config.enabled) return;
    if (!hasAnyConsent(channel)) {
      setVisible(true);
    }
  }, [config.enabled, channel]);

  // Allow re-opening cookie preferences from other parts of the app (e.g. account settings)
  useEffect(() => {
    function handleOpenSettings() {
      setVisible(true);
      setView("preferences");
    }
    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("open-cookie-settings", handleOpenSettings);
    };
  }, []);

  const handleAcceptAll = useCallback(() => {
    const categories = { analytics: true, marketing: true };
    saveConsent(channel, categories, config.consentExpiryDays);
    logConsentToServer(channel, categories);
    setVisible(false);
  }, [channel, config.consentExpiryDays]);

  const handleRejectAll = useCallback(() => {
    const categories = { analytics: false, marketing: false };
    saveConsent(channel, categories, config.consentExpiryDays);
    logConsentToServer(channel, categories);
    setVisible(false);
  }, [channel, config.consentExpiryDays]);

  const handleSavePreferences = useCallback(() => {
    const categories = { analytics: analyticsChecked, marketing: marketingChecked };
    saveConsent(channel, categories, config.consentExpiryDays);
    logConsentToServer(channel, categories);
    setVisible(false);
  }, [channel, analyticsChecked, marketingChecked, config.consentExpiryDays]);

  if (!visible) return null;

  const positionClasses =
    config.position === "bottom"
      ? "inset-x-0 bottom-0"
      : config.position === "bottom-left"
        ? "bottom-4 start-4 max-w-md"
        : "bottom-4 end-4 max-w-md";

  return (
    <div
      data-cd="ui-cookieConsent"
      className={`fixed ${positionClasses} z-50 animate-slide-up ${cdClasses}`}
      role="dialog"
      aria-label={text.bannerTitle ?? "Cookie Preferences"}
      style={buildComponentStyle("ui.cookieConsent", cdStyle)}
    >
      <div className="mx-auto max-w-4xl bg-white shadow-xl border border-neutral-200 rounded-t-xl p-5 sm:p-6">
        {view === "banner" ? (
          <BannerView
            text={text}
            channel={channel}
            onAcceptAll={handleAcceptAll}
            onRejectAll={handleRejectAll}
            onManage={() => setView("preferences")}
          />
        ) : (
          <PreferencesView
            text={text}
            analyticsChecked={analyticsChecked}
            marketingChecked={marketingChecked}
            onAnalyticsChange={setAnalyticsChecked}
            onMarketingChange={setMarketingChecked}
            onSave={handleSavePreferences}
            onBack={() => setView("banner")}
          />
        )}
      </div>
    </div>
  );
}

function BannerView({
  text,
  channel,
  onAcceptAll,
  onRejectAll,
  onManage,
}: {
  text: ReturnType<typeof useCookieConsentText>;
  channel: string;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManage: () => void;
}) {
  return (
    <>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-neutral-900 mb-1">
          {text.bannerTitle ?? "Cookie Preferences"}
        </h3>
        <p className="text-sm text-neutral-600 leading-relaxed">
          {text.bannerDescription ??
            "We use cookies to enhance your experience. Essential cookies are always active."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onAcceptAll}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          {text.acceptAllButton ?? "Accept All"}
        </button>
        <button
          onClick={onRejectAll}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          {text.rejectAllButton ?? "Essential Only"}
        </button>
        <button
          onClick={onManage}
          className="text-sm font-medium text-neutral-500 underline-offset-2 hover:underline hover:text-neutral-700 transition-colors"
        >
          {text.manageButton ?? "Manage Preferences"}
        </button>
        <a
          href={`/${channel}/pages/privacy-policy`}
          className="ms-auto text-xs text-neutral-400 underline-offset-2 hover:underline hover:text-neutral-600 transition-colors"
        >
          {text.policyLinkText ?? "Cookie Policy"}
        </a>
      </div>
    </>
  );
}

function PreferencesView({
  text,
  analyticsChecked,
  marketingChecked,
  onAnalyticsChange,
  onMarketingChange,
  onSave,
  onBack,
}: {
  text: ReturnType<typeof useCookieConsentText>;
  analyticsChecked: boolean;
  marketingChecked: boolean;
  onAnalyticsChange: (v: boolean) => void;
  onMarketingChange: (v: boolean) => void;
  onSave: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-neutral-900">
          {text.manageButton ?? "Manage Preferences"}
        </h3>
        <button
          onClick={onBack}
          className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
          aria-label="Back"
        >
          &larr;
        </button>
      </div>

      <div className="space-y-3 mb-5">
        {/* Essential — always on */}
        <CategoryToggle
          label={text.essentialLabel ?? "Essential"}
          description={
            text.essentialDescription ??
            "Required for basic site functionality (login, cart, checkout)."
          }
          checked
          disabled
        />
        {/* Analytics */}
        <CategoryToggle
          label={text.analyticsLabel ?? "Analytics"}
          description={
            text.analyticsDescription ??
            "Help us understand how visitors interact with our site."
          }
          checked={analyticsChecked}
          onChange={onAnalyticsChange}
        />
        {/* Marketing */}
        <CategoryToggle
          label={text.marketingLabel ?? "Marketing"}
          description={
            text.marketingDescription ??
            "Used for targeted advertising and remarketing."
          }
          checked={marketingChecked}
          onChange={onMarketingChange}
        />
      </div>

      <button
        onClick={onSave}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
      >
        {text.savePreferencesButton ?? "Save Preferences"}
      </button>
    </>
  );
}

function CategoryToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onChange?.(!checked)}
          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
            checked ? "bg-neutral-900" : "bg-neutral-300"
          } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${
              checked ? "translate-x-4 ms-0.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      <div className="min-w-0">
        <span className="block text-sm font-medium text-neutral-800">
          {label}
        </span>
        <span className="block text-xs text-neutral-500 leading-relaxed">
          {description}
        </span>
      </div>
    </label>
  );
}
