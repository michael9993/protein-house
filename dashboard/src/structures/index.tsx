import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { Route, Routes, useLocation, useParams } from "react-router";

import { MenuListUrlQueryParams, MenuListUrlSortField, menuPath, structuresListPath } from "./urls";
import MenuDetailsComponent from "./views/MenuDetails";
import MenuListComponent from "./views/MenuList";

const MenuList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: MenuListUrlQueryParams = asSortParams(qs, MenuListUrlSortField);

  return <MenuListComponent params={params} />;
};
const MenuDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));

  return <MenuDetailsComponent id={decodeURIComponent(id ?? "")} params={qs} />;
};
const NavigationRouter = () => (
  <Routes>
    <Route path={structuresListPath} element={<MenuList />} />
    <Route path={menuPath(":id")} element={<MenuDetails />} />
  </Routes>
);

export default NavigationRouter;
