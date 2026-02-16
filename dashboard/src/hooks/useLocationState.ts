import { ExtensionsPaths, LegacyAppSections } from "@dashboard/extensions/urls";
import { matchPath, useLocation } from "react-router";

// Exported for testing. Fix this. Once we drop legacy behavior, maybe we can drop this suite
export const isAppPath = (pathname: string) =>
  !!matchPath(`${LegacyAppSections.appsSection}:id/*`, pathname) ||
  !!matchPath(`${ExtensionsPaths.resolveViewManifestExtension(":id")}/*`, pathname);

/*
 * Use detailed information about the current location.
 */
export const useLocationState = () => {
  const location = useLocation();

  return {
    isAppPath: isAppPath(location.pathname),
  };
};
