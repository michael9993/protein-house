// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import Date from "@dashboard/components/Date";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import TableRowLink from "@dashboard/components/TableRowLink";
import { InvoiceFragment } from "@dashboard/graphql";
import { buttonMessages } from "@dashboard/intl";
import { TableBody, TableCell } from "@mui/material";
import { Button, Skeleton, Text } from "@saleor/macaw-ui-next";
import { Trash2Icon } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

interface OrderInvoiceListProps {
  invoices: InvoiceFragment[];
  onInvoiceGenerate: () => void;
  onInvoiceClick: (invoiceId: string) => void;
  onInvoiceSend: (invoiceId: string) => void;
  onInvoiceDelete?: (invoiceId: string) => void;
}

const OrderInvoiceList = (props: OrderInvoiceListProps) => {
  const { invoices, onInvoiceGenerate, onInvoiceClick, onInvoiceSend, onInvoiceDelete } = props;
  const intl = useIntl();
  const generatedInvoices = invoices?.filter(invoice => invoice.status === "SUCCESS");

  return (
    <DashboardCard className="overflow-hidden">
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage({
            id: "Gzg8hy",
            defaultMessage: "Invoices",
            description: "section header",
          })}
        </DashboardCard.Title>
        <DashboardCard.Toolbar>
          {onInvoiceGenerate && (
            <Button variant="secondary" onClick={onInvoiceGenerate}>
              <FormattedMessage
                id="e0RKe+"
                defaultMessage="Generate"
                description="generate invoice button"
              />
            </Button>
          )}
        </DashboardCard.Toolbar>
      </DashboardCard.Header>
      <DashboardCard.Content>
        {!generatedInvoices ? (
          <Skeleton />
        ) : !generatedInvoices?.length ? (
          <Text color="default2">
            <FormattedMessage id="hPB89Y" defaultMessage="No invoices to be shown" />
          </Text>
        ) : (
          <ResponsiveTable className="flex">
            <TableBody className="w-full">
              {generatedInvoices.map(invoice => (
                <TableRowLink key={invoice.id} hover={!!invoice}>
                  <TableCell
                    className={onInvoiceClick ? "cursor-pointer w-full" : "w-full"}
                    onClick={() => onInvoiceClick(invoice.id)}
                  >
                    <div>
                      <Text fontWeight="medium">
                        <FormattedMessage
                          id="m6IBe5"
                          defaultMessage="Invoice"
                          description="invoice number prefix"
                        />{" "}
                        {invoice.number}
                      </Text>
                      <Text
                        size={2}
                        fontWeight="light"
                        color="default2"
                        display="block"
                        marginTop={1}
                      >
                        <FormattedMessage
                          id="F0AXNs"
                          defaultMessage="created"
                          description="invoice create date prefix"
                        />{" "}
                        <Date date={invoice.createdAt} plain format="lll" />
                      </Text>
                    </div>
                  </TableCell>
                  {onInvoiceSend && (
                    <TableCell
                      className="[&_button]:p-0 px-2 w-auto"
                      onClick={() => onInvoiceSend(invoice.id)}
                    >
                      <Button>
                        <FormattedMessage {...buttonMessages.send} />
                      </Button>
                    </TableCell>
                  )}
                  {onInvoiceDelete && generatedInvoices.length > 1 && (
                    <TableCell
                      className="[&_button]:p-0 px-2 w-auto"
                      onClick={e => {
                        e.stopPropagation();
                        onInvoiceDelete(invoice.id);
                      }}
                    >
                      <Button variant="error">
                        <Trash2Icon size={16} />
                      </Button>
                    </TableCell>
                  )}
                </TableRowLink>
              ))}
            </TableBody>
          </ResponsiveTable>
        )}
      </DashboardCard.Content>
    </DashboardCard>
  );
};

OrderInvoiceList.displayName = "OrderInvoiceList";
export default OrderInvoiceList;
