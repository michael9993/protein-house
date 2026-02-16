import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { useIntl } from "react-intl";
import { Route, Routes, useParams, useLocation } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  shippingRateCreatePath,
  ShippingRateCreateUrlQueryParams,
  shippingRateEditPath,
  ShippingRateUrlQueryParams,
  shippingZoneAddPath,
  shippingZonePath,
  shippingZonesListPath,
  ShippingZonesListUrlQueryParams,
  ShippingZoneUrlQueryParams,
} from "./urls";
import RateCreateComponent from "./views/RateCreate";
import RateUpdateComponent from "./views/RateUpdate";
import ShippingZoneCreate from "./views/ShippingZoneCreate";
import ShippingZoneDetailsComponent from "./views/ShippingZoneDetails";
import ShippingZonesListComponent from "./views/ShippingZonesList";

const ShippingZonesList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ShippingZonesListUrlQueryParams = qs;

  return <ShippingZonesListComponent params={params} />;
};

const ShippingZoneDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ShippingZoneUrlQueryParams = qs;

  return <ShippingZoneDetailsComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const RateCreate = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ShippingRateCreateUrlQueryParams = qs;

  return <RateCreateComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const RateUpdate = () => {
  const { id, rateId } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: ShippingRateUrlQueryParams = qs;

  return (
    <RateUpdateComponent
      id={decodeURIComponent(id ?? "")}
      rateId={decodeURIComponent(rateId ?? "")}
      params={params}
    />
  );
};

const ShippingRouter = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.shipping)} />
      <Routes>
        <Route path={shippingZonesListPath} element={<ShippingZonesList />} />
        <Route path={shippingZoneAddPath} element={<ShippingZoneCreate />} />
        <Route path={shippingZonePath(":id")} element={<ShippingZoneDetails />} />
        <Route path={shippingRateCreatePath(":id")} element={<RateCreate />} />
        <Route path={shippingRateEditPath(":id", ":rateId")} element={<RateUpdate />} />
      </Routes>
    </>
  );
};

export default ShippingRouter;
