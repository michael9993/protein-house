import { ConditionalStaffMembersFilterProvider } from "@dashboard/components/ConditionalFilter";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useParams, useLocation } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  staffListPath,
  StaffListUrlQueryParams,
  StaffListUrlSortField,
  staffMemberDetailsPath,
  StaffMemberDetailsUrlQueryParams,
} from "./urls";
import { StaffDetailsView } from "./views/StaffDetails";
import StaffListComponent from "./views/StaffList";

const StaffList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: StaffListUrlQueryParams = asSortParams(qs, StaffListUrlSortField);

  return (
    <ConditionalStaffMembersFilterProvider locationSearch={location.search}>
      <StaffListComponent params={params} />
    </ConditionalStaffMembersFilterProvider>
  );
};

const StaffDetailsComponent = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: StaffMemberDetailsUrlQueryParams = qs;

  return <StaffDetailsView id={decodeURIComponent(id ?? "")} params={params} />;
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.staff)} />
      <Routes>
        <Route path={staffListPath} element={<StaffList />} />
        <Route path={staffMemberDetailsPath(":id")} element={<StaffDetailsComponent />} />
      </Routes>
    </>
  );
};

export default Component;
