import { withQs } from "@dashboard/utils/urls";

import { Dialog } from "../types";

const siteSettingsSection = "/site-settings";

export const siteSettingsPath = siteSettingsSection;
type SiteSettingsUrlDialog = "add-key";
type SiteSettingsUrlQueryParams = Dialog<SiteSettingsUrlDialog>;
export const siteSettingsUrl = (params?: SiteSettingsUrlQueryParams) =>
  withQs(siteSettingsPath, params);
