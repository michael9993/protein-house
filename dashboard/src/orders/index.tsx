import {
  ConditionalDraftOrderFilterProvider,
  ConditionalOrderFilterProvider,
} from "@dashboard/components/ConditionalFilter";
import { sectionNames } from "@dashboard/intl";
import { parseQs } from "@dashboard/url-utils";
import { asSortParams } from "@dashboard/utils/sort";
import { useIntl } from "react-intl";
import { Route, Routes, useLocation, useParams } from "react-router";

import { WindowTitle } from "../components/WindowTitle";
import {
  OrderDraftListUrlQueryParams,
  OrderDraftListUrlSortField,
  OrderFulfillUrlQueryParams,
  OrderListUrlQueryParams,
  OrderListUrlSortField,
  OrderUrlQueryParams,
} from "./urls";
import OrderDetailsComponent from "./views/OrderDetails";
import OrderDraftListComponent from "./views/OrderDraftList";
import OrderGrantRefundEditComponent from "./views/OrderEditGrantRefund";
import OrderFulfillComponent from "./views/OrderFulfill";
import OrderGrantRefundComponent from "./views/OrderGrantRefund";
import OrderListComponent from "./views/OrderList";
import OrderManualTransactionRefundComponent from "./views/OrderManualTransactionRefund";
import OrderRefundComponent from "./views/OrderRefund";
import OrderReturnComponent from "./views/OrderReturn";
import OrderSendRefundComponent from "./views/OrderSendRefund";
import OrderSettings from "./views/OrderSettings";
import OrderTransactionRefundCreateComponent from "./views/OrderTransactionRefundCreate";
import OrderTransactionRefundEditComponent from "./views/OrderTransactionRefundEdit";

const OrderList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: OrderListUrlQueryParams = asSortParams(
    qs,
    OrderListUrlSortField,
    OrderListUrlSortField.number,
    false,
  );

  return (
    <ConditionalOrderFilterProvider locationSearch={location.search}>
      <OrderListComponent params={params} />
    </ConditionalOrderFilterProvider>
  );
};
const OrderDraftList = () => {
  const location = useLocation();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: OrderDraftListUrlQueryParams = asSortParams(
    qs,
    OrderDraftListUrlSortField,
    OrderDraftListUrlSortField.number,
    false,
  );

  return (
    <ConditionalDraftOrderFilterProvider locationSearch={location.search}>
      <OrderDraftListComponent params={params} />
    </ConditionalDraftOrderFilterProvider>
  );
};
const OrderDetails = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: OrderUrlQueryParams = qs;

  return <OrderDetailsComponent id={decodeURIComponent(id ?? "")} params={params} />;
};
const OrderFulfill = () => {
  const location = useLocation();
  const { id } = useParams();
  const qs = parseQs(location.search.substr(1)) as any;
  const params: OrderFulfillUrlQueryParams = qs;

  return <OrderFulfillComponent orderId={decodeURIComponent(id ?? "")} params={params} />;
};
const OrderPaymentRefund = () => {
  const { id } = useParams();

  return <OrderRefundComponent orderId={decodeURIComponent(id ?? "")} />;
};
const OrderSendRefund = () => {
  const { id } = useParams();

  return <OrderSendRefundComponent orderId={decodeURIComponent(id ?? "")} />;
};
const OrderReturn = () => {
  const { id } = useParams();

  return <OrderReturnComponent orderId={decodeURIComponent(id ?? "")} />;
};
const OrderGrantRefund = () => {
  const { id } = useParams();

  return <OrderGrantRefundComponent orderId={decodeURIComponent(id ?? "")} />;
};
const OrderGrantRefundEdit = () => {
  const { orderId, refundId } = useParams();

  return (
    <OrderGrantRefundEditComponent
      orderId={decodeURIComponent(orderId ?? "")}
      grantRefundId={decodeURIComponent(refundId ?? "")}
    />
  );
};

const OrderTransactionRefund = () => {
  const { id } = useParams();

  return <OrderTransactionRefundCreateComponent orderId={decodeURIComponent(id ?? "")} />;
};

const OrderTransactionRefundEdit = () => {
  const { orderId, refundId } = useParams();

  return (
    <OrderTransactionRefundEditComponent
      orderId={decodeURIComponent(orderId ?? "")}
      refundId={decodeURIComponent(refundId ?? "")}
    />
  );
};
const OrderManualTransactionRefund = () => {
  const { id } = useParams();

  return (
    <OrderManualTransactionRefundComponent orderId={decodeURIComponent(id ?? "")} />
  );
};
const Component = () => {
  const intl = useIntl();

  return (
    <>
      <WindowTitle title={intl.formatMessage(sectionNames.orders)} />
      <Routes>
        <Route path="settings" element={<OrderSettings />} />
        <Route path="drafts" element={<OrderDraftList />} />
        <Route index element={<OrderList />} />
        <Route path=":id/fulfill" element={<OrderFulfill />} />
        <Route path=":id/return" element={<OrderReturn />} />
        <Route path=":id/payment-refund" element={<OrderPaymentRefund />} />
        <Route path=":id/send-refund" element={<OrderSendRefund />} />
        <Route path=":orderId/grant-refund/:refundId" element={<OrderGrantRefundEdit />} />
        <Route path=":id/grant-refund" element={<OrderGrantRefund />} />
        <Route path=":orderId/refund/:refundId" element={<OrderTransactionRefundEdit />} />
        <Route path=":id/refund" element={<OrderTransactionRefund />} />
        <Route path=":id/manual-refund" element={<OrderManualTransactionRefund />} />
        <Route path=":id" element={<OrderDetails />} />
      </Routes>
    </>
  );
};

export default Component;
