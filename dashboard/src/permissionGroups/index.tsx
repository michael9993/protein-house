import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useParams, useLocation } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  MembersListUrlSortField,
  PermissionGroupDetailsUrlQueryParams,
  PermissionGroupListUrlQueryParams,
  PermissionGroupListUrlSortField,
} from "./urls";
import { PermissionGroupCreate } from "./views/PermissionGroupCreate";
import { PermissionGroupDetails as PermissionGroupDetailsComponent } from "./views/PermissionGroupDetails";
import PermissionGroupListComponent from "./views/PermissionGroupList";

const PermissionGroupList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: PermissionGroupListUrlQueryParams = asSortParams(
    qs,
    PermissionGroupListUrlSortField,
  );

  return <PermissionGroupListComponent params={params} />;
};

const PermissionGroupDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: PermissionGroupDetailsUrlQueryParams = asSortParams(qs, MembersListUrlSortField);

  return (
    <PermissionGroupDetailsComponent id={decodeURIComponent(id ?? "")} params={params} />
  );
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.permissionGroups)} />
      <Routes>
        <Route index element={<PermissionGroupList />} />
        <Route path="add" element={<PermissionGroupCreate />} />
        <Route path=":id" element={<PermissionGroupDetails />} />
      </Routes>
    </>
  );
};

export default Component;
