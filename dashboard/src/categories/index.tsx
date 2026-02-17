import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  CategoryListUrlQueryParams,
  CategoryListUrlSortField,
  CategoryUrlQueryParams,
} from "./urls";
import { CategoryCreateView } from "./views/CategoryCreate";
import CategoryDetailsView from "./views/CategoryDetails";
import CategoryListComponent from "./views/CategoryList";

const CategoryDetails = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: CategoryUrlQueryParams = qs;

  return <CategoryDetailsView id={decodeURIComponent(id ?? "")} params={params} />;
};

const CategoryCreate = () => {
  const { id } = useParams();

  return (
    <CategoryCreateView
      parentId={id ? decodeURIComponent(id) : undefined}
    />
  );
};

const CategoryList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: CategoryListUrlQueryParams = {
    ...asSortParams(qs, CategoryListUrlSortField),
  };

  return <CategoryListComponent params={params} />;
};

const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.categories)} />
      <Routes>
        <Route index element={<CategoryList />} />
        <Route path="add" element={<CategoryCreate />} />
        <Route path=":id/add" element={<CategoryCreate />} />
        <Route path=":id" element={<CategoryDetails />} />
      </Routes>
    </>
  );
};

export default Component;
