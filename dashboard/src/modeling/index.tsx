import { ConditionalPageFilterProvider } from "@dashboard/components/ConditionalFilter";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  PageCreateUrlQueryParams,
  PageListUrlQueryParams,
  PageListUrlSortField,
  PageUrlQueryParams,
} from "./urls";
import PageCreateComponent from "./views/PageCreate";
import PageDetailsComponent from "./views/PageDetails";
import PageListComponent from "./views/PageList";

const PageList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: PageListUrlQueryParams = asSortParams(
    qs,
    PageListUrlSortField,
    PageListUrlSortField.title,
  );

  return (
    <ConditionalPageFilterProvider locationSearch={location.search}>
      <PageListComponent params={params} />
    </ConditionalPageFilterProvider>
  );
};

const PageCreate = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: PageCreateUrlQueryParams = qs;

  return <PageCreateComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const PageDetails = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: PageUrlQueryParams = qs;

  return <PageDetailsComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.models)} />
      <Routes>
        <Route index element={<PageList />} />
        <Route path="add" element={<PageCreate />} />
        <Route path=":id" element={<PageDetails />} />
      </Routes>
    </>
  );
};

export default Component;
