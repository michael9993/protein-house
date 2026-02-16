import { SectionGuard } from "@dashboard/auth/components/SectionRoute";
import { WindowTitle } from "@dashboard/components/WindowTitle";
import {
  AppDetailsUrlQueryParams,
  CustomAppDetailsUrlQueryParams,
  ExtensionInstallQueryParams,
  ExtensionsPaths,
  PluginUrlQueryParams,
} from "@dashboard/extensions/urls";
import { ExploreExtensions } from "@dashboard/extensions/views/ExploreExtensions/ExploreExtensions";
import { InstallCustomExtension } from "@dashboard/extensions/views/InstallCustomExtension/InstallCustomExtension";
import { InstalledExtensions } from "@dashboard/extensions/views/InstalledExtensions/InstalledExtensions";
import { PermissionEnum } from "@dashboard/graphql";
import { sectionNames } from "@dashboard/intl";
import NotFound from "@dashboard/NotFound";
import { parseQs } from "@dashboard/url-utils";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { useCustomAppToken } from "./hooks/useCustomAppToken";
import { AddCustomExtension } from "./views/AddCustomExtension/AddCustomExtension";
import { AddCustomExtensionWebhook } from "./views/AddCustomExtensionWebhook/AddCustomExtensionWebhook";
import { EditCustomExtension } from "./views/EditCustomExtension";
import { EditCustomExtensionWebhook } from "./views/EditCustomExtensionWebhook/EditCustomExtensionWebhook";
import { EditManifestExtension } from "./views/EditManifestExtension/AppManageView";
import { EditManifestExtensionPermissions } from "./views/EditManifestExtensionPermissions/EditManifestExtensionPermissions";
import { EditPluginExtension } from "./views/EditPluginExtension/EditPluginExtension";
import { ViewManifestExtensionIframe } from "./views/ViewManifestExtension/ViewManifestExtensionIframe";

const ExploreExtensionsView = () => {
  return <ExploreExtensions />;
};

const InstalledExtensionsView = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params = qs;

  return <InstalledExtensions params={params} />;
};
const InstallCustomExtensionView = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ExtensionInstallQueryParams = qs;

  return <InstallCustomExtension params={params} />;
};

const EditCustomExtensionView = ({
  token,
  onTokenClose,
}: { token: string; onTokenClose: () => void }) => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: CustomAppDetailsUrlQueryParams = qs;

  if (!id) {
    throw new Error("No ID provided");
  }

  return (
    <EditCustomExtension
      id={decodeURIComponent(id)}
      params={params}
      token={token}
      onTokenClose={onTokenClose}
    />
  );
};

const EditManifestExtensionView = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: AppDetailsUrlQueryParams = qs;

  return <EditManifestExtension id={decodeURIComponent(id ?? "")} params={params} />;
};

const ViewManifestExtensionIframeView = () => {
  const { id } = useParams();

  return <ViewManifestExtensionIframe id={decodeURIComponent(id ?? "")} />;
};

const EditManifestExtensionPermissionsView = () => {
  const { id } = useParams();

  return <EditManifestExtensionPermissions id={decodeURIComponent(id ?? "")} />;
};

const EditPluginExtensionView = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: PluginUrlQueryParams = qs;
  const decodedId = decodeURIComponent(id ?? "");

  if (!decodedId) {
    throw new Error("No ID provided");
  }

  return <EditPluginExtension id={decodedId} params={params} />;
};

const AddCustomExtensionWebhookView = () => {
  const { appId } = useParams();

  if (!appId) {
    throw new Error("No App ID provided");
  }

  return <AddCustomExtensionWebhook appId={decodeURIComponent(appId)} />;
};

const EditCustomExtensionWebhookView = () => {
  const { id } = useParams();

  if (!id) {
    throw new Error("No ID provided");
  }

  return <EditCustomExtensionWebhook id={decodeURIComponent(id)} />;
};

export const ExtensionsSection = () => {
  const intl = useIntl();

  const { customAppToken, setCustomAppToken } = useCustomAppToken();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.extensions)} />
      <Routes>
        <Route path={ExtensionsPaths.exploreExtensions} element={<ExploreExtensionsView />} />
        <Route
          path={ExtensionsPaths.installedExtensions}
          element={<InstalledExtensionsView />}
        />
        <Route
          path={ExtensionsPaths.installCustomExtension}
          element={
            <SectionGuard permissions={[PermissionEnum.MANAGE_APPS]}>
              <InstallCustomExtensionView />
            </SectionGuard>
          }
        />

        {/* -- Manifest app routes -- */}
        <Route
          path={ExtensionsPaths.resolveEditManifestExtension(":id")}
          element={<EditManifestExtensionView />}
        />
        <Route
          path={ExtensionsPaths.resolveAppRequestPermissionsPath(":id")}
          element={<EditManifestExtensionPermissionsView />}
        />
        <Route
          path={ExtensionsPaths.resolveViewManifestExtension(":id")}
          element={<ViewManifestExtensionIframeView />}
        />

        {/* -- Plugin routes -- */}
        <Route
          path={ExtensionsPaths.resolveEditPluginExtension(":id")}
          element={<EditPluginExtensionView />}
        />

        {/* -- Custom apps routes -- */}
        <Route
          path={ExtensionsPaths.addCustomExtension}
          element={<AddCustomExtension setToken={setCustomAppToken} />}
        />
        <Route
          path={ExtensionsPaths.resolveEditCustomExtension(":id")}
          element={
            <EditCustomExtensionView
              token={customAppToken || ""}
              onTokenClose={() => setCustomAppToken(null)}
            />
          }
        />

        <Route
          path={ExtensionsPaths.resolveAddCustomExtensionWebhook(":appId")}
          element={
            <SectionGuard permissions={[PermissionEnum.MANAGE_APPS]}>
              <AddCustomExtensionWebhookView />
            </SectionGuard>
          }
        />
        <Route
          path={ExtensionsPaths.resolveEditCustomExtensionWebhook(":appId", ":id")}
          element={
            <SectionGuard permissions={[PermissionEnum.MANAGE_APPS]}>
              <EditCustomExtensionWebhookView />
            </SectionGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};
