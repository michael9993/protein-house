import { ConditionalAttributesFilterProvider } from "@dashboard/components/ConditionalFilter";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  attributeAddPath,
  AttributeAddUrlQueryParams,
  attributeListPath,
  AttributeListUrlQueryParams,
  AttributeListUrlSortField,
  attributePath,
  AttributeUrlQueryParams,
} from "./urls";
import AttributeCreateComponent from "./views/AttributeCreate";
import AttributeDetailsComponent from "./views/AttributeDetails";
import AttributeListComponent from "./views/AttributeList";

const AttributeList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: AttributeListUrlQueryParams = asSortParams(qs, AttributeListUrlSortField);

  return (
    <ConditionalAttributesFilterProvider locationSearch={location.search}>
      <AttributeListComponent params={params} />
    </ConditionalAttributesFilterProvider>
  );
};

const AttributeCreate = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: AttributeAddUrlQueryParams = qs;

  return <AttributeCreateComponent params={params} />;
};

const AttributeDetails = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: AttributeUrlQueryParams = qs;

  return <AttributeDetailsComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const AttributeSection = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.attributes)} />
      <Routes>
        <Route path={attributeListPath} element={<AttributeList />} />
        <Route path={attributeAddPath} element={<AttributeCreate />} />
        <Route path={attributePath(":id")} element={<AttributeDetails />} />
      </Routes>
    </>
  );
};

export default AttributeSection;
