import { withQs } from "@dashboard/utils/urls";

export const globalSearchUrl = (params?: { query?: string; scope?: string; trigger?: boolean }) =>
  withQs("/search", { q: params?.query, scope: params?.scope, t: params?.trigger });
