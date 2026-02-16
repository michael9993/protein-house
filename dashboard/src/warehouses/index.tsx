import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  warehouseAddPath,
  warehouseListPath,
  WarehouseListUrlQueryParams,
  WarehouseListUrlSortField,
  warehousePath,
  WarehouseUrlQueryParams,
} from "./urls";
import WarehouseCreate from "./views/WarehouseCreate";
import WarehouseDetailsComponent from "./views/WarehouseDetails";
import WarehouseListComponent from "./views/WarehouseList";

const WarehouseList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: WarehouseListUrlQueryParams = asSortParams(qs, WarehouseListUrlSortField);

  return <WarehouseListComponent params={params} />;
};

const WarehouseDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: WarehouseUrlQueryParams = qs;

  return <WarehouseDetailsComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const WarehouseSection = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.warehouses)} />
      <Routes>
        <Route path={warehouseListPath} element={<WarehouseList />} />
        <Route path={warehouseAddPath} element={<WarehouseCreate />} />
        <Route path={warehousePath(":id")} element={<WarehouseDetails />} />
      </Routes>
    </>
  );
};

export default WarehouseSection;
