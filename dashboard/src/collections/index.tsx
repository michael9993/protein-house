import { ConditionalCollectionFilterProvider } from "@dashboard/components/ConditionalFilter";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  CollectionCreateUrlQueryParams,
  CollectionListUrlQueryParams,
  CollectionListUrlSortField,
  CollectionUrlQueryParams,
} from "./urls";
import CollectionCreateView from "./views/CollectionCreate";
import CollectionDetailsView from "./views/CollectionDetails";
import CollectionListView from "./views/CollectionList";

const CollectionList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: CollectionListUrlQueryParams = asSortParams(qs, CollectionListUrlSortField);

  return (
    <ConditionalCollectionFilterProvider locationSearch={location.search}>
      <CollectionListView params={params} />
    </ConditionalCollectionFilterProvider>
  );
};

const CollectionDetails = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: CollectionUrlQueryParams = qs;

  return <CollectionDetailsView id={decodeURIComponent(id ?? "")} params={params} />;
};

const CollectionCreate = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: CollectionCreateUrlQueryParams = qs;

  return <CollectionCreateView params={params} />;
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.collections)} />
      <Routes>
        <Route index element={<CollectionList />} />
        <Route path="add" element={<CollectionCreate />} />
        <Route path=":id" element={<CollectionDetails />} />
      </Routes>
    </>
  );
};

export default Component;
