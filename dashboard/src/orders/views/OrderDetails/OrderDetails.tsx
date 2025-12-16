// @ts-strict-ignore
import { useApolloClient } from "@apollo/client";
import { MetadataIdSchema } from "@dashboard/components/Metadata";
import NotFoundPage from "@dashboard/components/NotFoundPage";
import { SaleorThrobber } from "@dashboard/components/Throbber/SaleorThrobber";
import { Task } from "@dashboard/containers/BackgroundTasks/types";
import { useState } from "react";
import {
  JobStatusEnum,
  OrderDetailsWithMetadataDocument,
  OrderStatus,
  useOrderConfirmMutation,
  useUpdateMetadataMutation,
  useUpdatePrivateMetadataMutation,
} from "@dashboard/graphql";
import useBackgroundTask from "@dashboard/hooks/useBackgroundTask";
import useNavigator from "@dashboard/hooks/useNavigator";
import useNotifier from "@dashboard/hooks/useNotifier";
import { commonMessages } from "@dashboard/intl";
import { createOrderMetadataIdSchema } from "@dashboard/orders/components/OrderDetailsPage/utils";
import getOrderErrorMessage from "@dashboard/utils/errors/order";
import createDialogActionHandlers from "@dashboard/utils/handlers/dialogActionHandlers";
import createMetadataUpdateHandler from "@dashboard/utils/handlers/metadataUpdateHandler";
import { useIntl } from "react-intl";

import OrderOperations from "../../containers/OrderOperations";
import { orderListUrl, orderUrl, OrderUrlDialog, OrderUrlQueryParams } from "../../urls";
import { OrderDetailsMessages } from "./OrderDetailsMessages";
import { OrderDraftDetails } from "./OrderDraftDetails";
import { OrderNormalDetails } from "./OrderNormalDetails";
import { OrderUnconfirmedDetails } from "./OrderUnconfirmedDetails";
import { useOrderDetails } from "./useOrderDetails";

interface OrderDetailsProps {
  id: string;
  params: OrderUrlQueryParams;
}

const OrderDetails = ({ id, params }: OrderDetailsProps) => {
  const navigate = useNavigator();
  const { queue } = useBackgroundTask();
  const intl = useIntl();
  const [updateMetadata, updateMetadataOpts] = useUpdateMetadataMutation({});
  const [updatePrivateMetadata, updatePrivateMetadataOpts] = useUpdatePrivateMetadataMutation({});
  const notify = useNotifier();
  const apolloClient = useApolloClient();
  const [openModal, closeModal] = createDialogActionHandlers<OrderUrlDialog, OrderUrlQueryParams>(
    navigate,
    params => orderUrl(id, params),
    params,
    ["type"],
  );
  const handleBack = () => navigate(orderListUrl());
  const [orderConfirm] = useOrderConfirmMutation({
    onCompleted: ({ orderConfirm: { errors } }) => {
      const isError = !!errors.length;

      notify({
        status: isError ? "error" : "success",
        text: isError ? getOrderErrorMessage(errors[0], intl) : "Confirmed Order",
      });
    },
  });

  const { data, loading, refetch, isRefetching } = useOrderDetails(id);
  const [isCapturing, setIsCapturing] = useState(false);

  const order = data?.order;

  if (order === null) {
    return <NotFoundPage onBack={handleBack} />;
  }

  const isOrderUnconfirmed = order?.status === OrderStatus.UNCONFIRMED;
  const isOrderDraft = order?.status === OrderStatus.DRAFT;
  const handleSubmit = async (data: MetadataIdSchema) => {
    if (order?.status === OrderStatus.UNCONFIRMED) {
      await orderConfirm({ variables: { id: order?.id } });
    }

    const initial = createOrderMetadataIdSchema(order);
    const metadataPromises = Object.entries(initial).map(([id, metaEntry]) => {
      const update = createMetadataUpdateHandler(
        { ...metaEntry, id },
        () => Promise.resolve([]),
        variables => updateMetadata({ variables }),
        variables => updatePrivateMetadata({ variables }),
      );

      return update(data[id]);
    });
    const result = await Promise.all(metadataPromises);
    const errors = result.reduce((p, c) => p.concat(c), []);

    if (errors.length === 0) {
      notify({
        status: "success",
        text: intl.formatMessage(commonMessages.savedChanges),
      });
    }

    return result;
  };

  return (
    <OrderDetailsMessages
      id={id}
      params={params}
      refetchOrder={refetch}
      isRefetching={isRefetching}
      isCapturing={isCapturing}
      setIsCapturing={setIsCapturing}
    >
      {orderMessages => (
        <OrderOperations
          order={id}
          onNoteAdd={orderMessages.handleNoteAdd}
          onNoteUpdate={orderMessages.handleNoteUpdate}
          onOrderCancel={orderMessages.handleOrderCancel}
          onOrderVoid={orderMessages.handleOrderVoid}
          onPaymentCapture={orderMessages.handlePaymentCapture}
          onUpdate={orderMessages.handleUpdate}
          onDraftUpdate={orderMessages.handleDraftUpdate}
          onShippingMethodUpdate={data => {
            orderMessages.handleShippingMethodUpdate(data);
            order.total = data.orderUpdateShipping.order.total;
          }}
          onOrderLineDelete={orderMessages.handleOrderLineDelete}
          onOrderLinesAdd={orderMessages.handleOrderLinesAdd}
          onOrderLineUpdate={orderMessages.handleOrderLineUpdate}
          onOrderFulfillmentApprove={orderMessages.handleOrderFulfillmentApprove}
          onOrderFulfillmentCancel={orderMessages.handleOrderFulfillmentCancel}
          onOrderFulfillmentUpdate={orderMessages.handleOrderFulfillmentUpdate}
          onDraftFinalize={orderMessages.handleDraftFinalize}
          onDraftCancel={orderMessages.handleDraftCancel}
          onOrderMarkAsPaid={orderMessages.handleOrderMarkAsPaid}
          onInvoiceRequest={data => {
            if (data.invoiceRequest.invoice.status === JobStatusEnum.SUCCESS) {
              orderMessages.handleInvoiceGenerateFinished(data);
            } else {
              orderMessages.handleInvoiceGeneratePending(data);
              queue(Task.INVOICE_GENERATE, {
                generateInvoice: {
                  invoiceId: data.invoiceRequest.invoice.id,
                  orderId: id,
                },
              });
            }
          }}
          onInvoiceSend={orderMessages.handleInvoiceSend}
          onInvoiceDelete={orderMessages.handleInvoiceDelete}
          onTransactionActionSend={orderMessages.handleTransactionAction}
          onManualTransactionAdded={async data => {
            await apolloClient.refetchQueries({
              include: [OrderDetailsWithMetadataDocument],
            });
            orderMessages.handleAddManualTransaction(data);
          }}
        >
          {({
            orderAddNote,
            orderUpdateNote,
            orderCancel,
            orderDraftUpdate,
            orderLinesAdd,
            orderLineDelete,
            orderLineUpdate,
            orderPaymentCapture,
            orderVoid,
            orderShippingMethodUpdate,
            orderUpdate,
            orderFulfillmentApprove,
            orderFulfillmentCancel,
            orderFulfillmentUpdateTracking,
            orderDraftCancel,
            orderDraftFinalize,
            orderPaymentMarkAsPaid,
            orderInvoiceRequest,
            orderInvoiceSend,
            orderInvoiceDelete,
            orderTransactionAction,
            orderAddManualTransaction,
          }) => {
            // Show spinner when capturing (mutation loading) or refetching after capture
            const showSpinner = isCapturing || orderPaymentCapture.opts.loading || isRefetching;

            return (
              <>
                {/* Spinner overlay when capturing payment */}
                {showSpinner && (
                  <div
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 9999,
                      cursor: "wait",
                    }}
                    data-test-id="payment-capture-spinner-overlay"
                  >
                    <div
                      style={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <SaleorThrobber size={48} />
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "#333",
                        }}
                      >
                        {intl.formatMessage({
                          id: "paymentCaptureLoading",
                          defaultMessage: "Capturing payment and refreshing order details...",
                        })}
                      </span>
                    </div>
                  </div>
                )}
                {!isOrderDraft && !isOrderUnconfirmed && (
                  <OrderNormalDetails
                    id={id}
                    params={params}
                    loading={loading}
                    data={data}
                    orderAddNote={orderAddNote}
                    orderUpdateNote={orderUpdateNote}
                    orderInvoiceRequest={orderInvoiceRequest}
                    handleSubmit={handleSubmit}
                    orderUpdate={orderUpdate}
                    orderCancel={orderCancel}
                    orderPaymentMarkAsPaid={orderPaymentMarkAsPaid}
                    orderVoid={orderVoid}
                    orderPaymentCapture={orderPaymentCapture}
                    orderFulfillmentApprove={orderFulfillmentApprove}
                    orderFulfillmentCancel={orderFulfillmentCancel}
                    orderFulfillmentUpdateTracking={orderFulfillmentUpdateTracking}
                    orderInvoiceSend={orderInvoiceSend}
                    orderInvoiceDelete={orderInvoiceDelete}
                    orderTransactionAction={orderTransactionAction}
                    orderAddManualTransaction={orderAddManualTransaction}
                    updateMetadataOpts={updateMetadataOpts}
                    updatePrivateMetadataOpts={updatePrivateMetadataOpts}
                    openModal={openModal}
                    closeModal={closeModal}
                    isRefetching={isRefetching}
                    refetchOrder={orderMessages.refetchOrder}
                    isCapturing={isCapturing}
                    setIsCapturing={setIsCapturing}
                  />
                )}
                {isOrderDraft && (
                  <OrderDraftDetails
                    id={id}
                    params={params}
                    loading={loading}
                    data={data}
                    orderAddNote={orderAddNote}
                    orderUpdateNote={orderUpdateNote}
                    orderLineUpdate={orderLineUpdate}
                    orderLineDelete={orderLineDelete}
                    orderShippingMethodUpdate={orderShippingMethodUpdate}
                    orderLinesAdd={orderLinesAdd}
                    orderDraftUpdate={orderDraftUpdate}
                    orderDraftCancel={orderDraftCancel}
                    orderDraftFinalize={orderDraftFinalize}
                    openModal={openModal}
                    closeModal={closeModal}
                  />
                )}
                {isOrderUnconfirmed && (
                  <OrderUnconfirmedDetails
                    id={id}
                    params={params}
                    data={data}
                    orderAddNote={orderAddNote}
                    orderUpdateNote={orderUpdateNote}
                    orderLineUpdate={orderLineUpdate}
                    orderLineDelete={orderLineDelete}
                    orderInvoiceRequest={orderInvoiceRequest}
                    handleSubmit={handleSubmit}
                    orderUpdate={orderUpdate}
                    orderCancel={orderCancel}
                    orderShippingMethodUpdate={orderShippingMethodUpdate}
                    orderLinesAdd={orderLinesAdd}
                    orderPaymentMarkAsPaid={orderPaymentMarkAsPaid}
                    orderVoid={orderVoid}
                    orderPaymentCapture={orderPaymentCapture}
                    orderFulfillmentApprove={orderFulfillmentApprove}
                    orderFulfillmentCancel={orderFulfillmentCancel}
                    orderFulfillmentUpdateTracking={orderFulfillmentUpdateTracking}
                    orderInvoiceSend={orderInvoiceSend}
                    orderInvoiceDelete={orderInvoiceDelete}
                    updateMetadataOpts={updateMetadataOpts}
                    updatePrivateMetadataOpts={updatePrivateMetadataOpts}
                    orderTransactionAction={orderTransactionAction}
                    orderAddManualTransaction={orderAddManualTransaction}
                    openModal={openModal}
                    closeModal={closeModal}
                    isRefetching={isRefetching}
                    refetchOrder={orderMessages.refetchOrder}
                    isCapturing={isCapturing}
                    setIsCapturing={setIsCapturing}
                  />
                )}
              </>
            );
          }}
        </OrderOperations>
      )}
    </OrderDetailsMessages>
  );
};

export default OrderDetails;
