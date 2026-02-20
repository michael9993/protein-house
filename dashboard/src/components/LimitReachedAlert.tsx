import { DashboardAlert, DashboardAlertProps } from "@dashboard/components/Alert/DashboardAlert";
import { sprinkles } from "@saleor/macaw-ui-next";
import clsx from "clsx";

type LimitReachedAlertProps = Omit<DashboardAlertProps, "severity">;

const LimitReachedAlert = (props: LimitReachedAlertProps) => (
  <DashboardAlert
    severity="warning"
    className={clsx(
      sprinkles({
        gridColumn: "8",
        marginBottom: 2,
      }),
      props.className,
    )}
    {...props}
  />
);

LimitReachedAlert.displayName = "LimitReachedAlert";
export default LimitReachedAlert;
