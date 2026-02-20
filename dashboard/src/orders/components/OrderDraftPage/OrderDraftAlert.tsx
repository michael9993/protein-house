import { ChannelUsabilityDataQuery, OrderDetailsFragment } from "@dashboard/graphql";
import { shippingZonesListPath } from "@dashboard/shipping/urls";
import { DashboardAlert, DashboardAlertProps } from "@dashboard/components/Alert/DashboardAlert";
import { sprinkles } from "@saleor/macaw-ui-next";
import clsx from "clsx";
import { FormattedMessage, MessageDescriptor, useIntl } from "react-intl";
import { Link } from "react-router";

import OrderAlerts from "../OrderAlerts";
import { alertMessages } from "./messages";

const getAlerts = (
  order?: OrderDetailsFragment,
  channelUsabilityData?: ChannelUsabilityDataQuery,
) => {
  const canDetermineShippingMethods =
    order?.shippingAddress?.country.code && !!order?.lines?.length;
  const isChannelInactive = order && !order.channel.isActive;
  const noProductsInChannel = channelUsabilityData?.products?.totalCount === 0;
  const noShippingMethodsInChannel =
    canDetermineShippingMethods && order?.shippingMethods.length === 0;

  let alerts: MessageDescriptor[] = [];

  if (isChannelInactive) {
    alerts = [...alerts, alertMessages.inactiveChannel];
  }

  if (noProductsInChannel) {
    alerts = [...alerts, alertMessages.noProductsInChannel];
  }

  if (noShippingMethodsInChannel) {
    alerts = [...alerts, alertMessages.noShippingMethodsInChannel];
  }

  return alerts;
};

export type OrderDraftAlertProps = Omit<DashboardAlertProps, "severity"> & {
  order?: OrderDetailsFragment;
  channelUsabilityData?: ChannelUsabilityDataQuery;
};

const OrderDraftAlert = (props: OrderDraftAlertProps) => {
  const { order, channelUsabilityData, ...alertProps } = props;
  const intl = useIntl();
  const alerts = getAlerts(order, channelUsabilityData);

  if (!alerts.length) {
    return null;
  }

  return (
    <DashboardAlert
      severity="warning"
      className="mb-6"
      {...alertProps}
    >
      <OrderAlerts
        alerts={alerts}
        alertsHeader={intl.formatMessage(alertMessages.manyAlerts)}
        values={{
          country: order?.shippingAddress?.country.country,
          configLink: (
            <Link
              to={shippingZonesListPath}
              target="_blank"
              className={sprinkles({
                textDecoration: "underline",
                color: "accent1",
              })}
            >
              <FormattedMessage
                defaultMessage="shipping zones configuration"
                id="T3cLGs"
                description="alert link message"
              />
            </Link>
          ),
        }}
      />
    </DashboardAlert>
  );
};

OrderDraftAlert.displayName = "OrderDraftAlert";
export default OrderDraftAlert;
