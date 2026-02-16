import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  modelTypesPath,
  pageTypeAddPath,
  PageTypeListUrlQueryParams,
  PageTypeListUrlSortField,
  pageTypePath,
  PageTypeUrlQueryParams,
} from "./urls";
import PageTypeCreate from "./views/PageTypeCreate";
import PageTypeDetailsComponent from "./views/PageTypeDetails";
import PageTypeListComponent from "./views/PageTypeList";

const PageTypeList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: PageTypeListUrlQueryParams = asSortParams(qs, PageTypeListUrlSortField);

  return <PageTypeListComponent params={params} />;
};

const PageTypeDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: PageTypeUrlQueryParams = qs;

  return <PageTypeDetailsComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const PageTypeRouter = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.modelTypes)} />
      <Routes>
        <Route path={modelTypesPath} element={<PageTypeList />} />
        <Route path={pageTypeAddPath} element={<PageTypeCreate />} />
        <Route path={pageTypePath(":id")} element={<PageTypeDetails />} />
      </Routes>
    </>
  );
};

PageTypeRouter.displayName = "PageTypeRouter";
export default PageTypeRouter;
