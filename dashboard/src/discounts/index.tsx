import {
  ConditionalDiscountFilterProvider,
  ConditionalVoucherFilterProvider,
} from "@dashboard/components/ConditionalFilter";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import { DiscountListUrlQueryParams, DiscountListUrlSortField } from "./discountsUrls";
import {
  saleAddPath,
  saleListPath,
  salePath,
  voucherAddPath,
  VoucherCreateUrlQueryParams,
  voucherListPath,
  VoucherListUrlQueryParams,
  VoucherListUrlSortField,
  voucherPath,
  VoucherUrlQueryParams,
} from "./urls";
import { DiscountCreate } from "./views/DiscountCreate";
import { DiscountDetails } from "./views/DiscountDetails";
import { DiscountList } from "./views/DiscountList";
import VoucherCreateViewComponent from "./views/VoucherCreate";
import VoucherDetailsViewComponent from "./views/VoucherDetails";
import VoucherListViewComponent from "./views/VoucherList";

const SaleListView = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;

  const params: DiscountListUrlQueryParams = asSortParams(qs, DiscountListUrlSortField);

  return (
    <ConditionalDiscountFilterProvider locationSearch={location.search}>
      <DiscountList params={params} />
    </ConditionalDiscountFilterProvider>
  );
};
const SaleDetailsView = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params = qs;

  return <DiscountDetails id={decodeURIComponent(id ?? "")} params={params} />;
};
const SaleCreateView = () => {
  return <DiscountCreate />;
};
const VoucherListView = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: VoucherListUrlQueryParams = asSortParams(
    qs,
    VoucherListUrlSortField,
    VoucherListUrlSortField.code,
  );

  return (
    <ConditionalVoucherFilterProvider locationSearch={location.search}>
      <VoucherListViewComponent params={params} />
    </ConditionalVoucherFilterProvider>
  );
};
const VoucherDetailsView = () => {
  const { id } = useParams();
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: VoucherUrlQueryParams = qs;

  return <VoucherDetailsViewComponent id={decodeURIComponent(id ?? "")} params={params} />;
};
const VoucherCreateView = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1));
  const params: VoucherCreateUrlQueryParams = qs;

  return <VoucherCreateViewComponent params={params} />;
};

const DiscountSection = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.vouchers)} />
      <Routes>
        <Route path={saleListPath} element={<SaleListView />} />
        <Route path={saleAddPath} element={<SaleCreateView />} />
        <Route path={voucherAddPath} element={<VoucherCreateView />} />
        <Route path={salePath(":id")} element={<SaleDetailsView />} />
        <Route path={voucherListPath} element={<VoucherListView />} />
        <Route path={voucherPath(":id")} element={<VoucherDetailsView />} />
      </Routes>
    </>
  );
};

export default DiscountSection;
