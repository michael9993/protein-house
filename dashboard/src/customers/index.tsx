import { ConditionalCustomerFilterProvider } from "@dashboard/components/ConditionalFilter";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  CustomerAddressesUrlQueryParams,
  CustomerListUrlQueryParams,
  CustomerListUrlSortField,
  CustomerServiceListUrlQueryParams,
  CustomerServiceListUrlSortField,
  CustomerServiceUrlQueryParams,
  CustomerUrlQueryParams,
} from "./urls";
import CustomerAddressesViewComponent from "./views/CustomerAddresses";
import CustomerCreateView from "./views/CustomerCreate";
import CustomerDetailsViewComponent from "./views/CustomerDetails";
import CustomerListViewComponent from "./views/CustomerList";
import CustomerServiceDetailsViewComponent from "./views/CustomerServiceDetails";
import CustomerServiceListViewComponent from "./views/CustomerServiceList";

const CustomerListView = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: CustomerListUrlQueryParams = asSortParams(qs, CustomerListUrlSortField);

  return (
    <ConditionalCustomerFilterProvider locationSearch={location.search}>
      <CustomerListViewComponent params={params} />
    </ConditionalCustomerFilterProvider>
  );
};

const CustomerDetailsView = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: CustomerUrlQueryParams = qs;

  return <CustomerDetailsViewComponent id={decodeURIComponent(id ?? "")} params={params} />;
};

const CustomerAddressesView = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: CustomerAddressesUrlQueryParams = qs;

  return (
    <CustomerAddressesViewComponent id={decodeURIComponent(id ?? "")} params={params} />
  );
};

const CustomerServiceListView = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: CustomerServiceListUrlQueryParams = asSortParams(qs, CustomerServiceListUrlSortField);

  return <CustomerServiceListViewComponent params={params} />;
};

const CustomerServiceDetailsView = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1));
  const params: CustomerServiceUrlQueryParams = qs;

  return (
    <CustomerServiceDetailsViewComponent id={decodeURIComponent(id ?? "")} params={params} />
  );
};

export const CustomerSection = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.customers)} />
      <Routes>
        <Route index element={<CustomerListView />} />
        <Route path="add" element={<CustomerCreateView />} />
        <Route path="service" element={<CustomerServiceListView />} />
        <Route path="service/:id" element={<CustomerServiceDetailsView />} />
        <Route path=":id/addresses" element={<CustomerAddressesView />} />
        <Route path=":id" element={<CustomerDetailsView />} />
      </Routes>
    </>
  );
};
