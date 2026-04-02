/**
 * Language resolution for Saleor's translation system.
 *
 * Base content is in English. Hebrew translations are added for the ILS channel.
 * The storefront queries include `translation(languageCode: $languageCode)` fields.
 * Components use the `t()` helper to prefer translated content over base content.
 */

import { LanguageCodeEnum } from "@/gql/graphql";

/**
 * Maps a Saleor channel slug to the LanguageCodeEnum value for translations.
 * Hebrew channels get HE to load Hebrew translations.
 * English channels get EN — since base content is English, the translation
 * field returns null and components fall back to the base English content.
 */
export function getLanguageCodeForChannel(channel: string): LanguageCodeEnum {
  const lc = channel.toLowerCase();
  if (lc === "ils" || lc === "default-channel") {
    return LanguageCodeEnum.He;
  }
  return LanguageCodeEnum.En;
}

/**
 * Resolve translated name from any translatable Saleor entity.
 * Prefers translated name, falls back to base name.
 */
export function t<
  T extends { translation?: { name?: string | null } | null; name: string },
>(item: T): string {
  return item.translation?.name || item.name;
}

/**
 * Resolve translated description from any translatable Saleor entity.
 * Prefers translated description, falls back to base description.
 */
export function tDesc<
  T extends {
    translation?: { description?: string | null } | null;
    description?: string | null;
  },
>(item: T): string | null {
  return item.translation?.description || item.description || null;
}
