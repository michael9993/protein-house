// @ts-strict-ignore
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import TableRowLink from "@dashboard/components/TableRowLink";
import { FormChange } from "@dashboard/hooks/useForm";
import { removeAtIndex, updateAtIndex } from "@dashboard/utils/lists";
import { TableBody, TableCell } from "@dashboard/components/Table";
import { TextField } from "@mui/material";
import { IconButton } from "@saleor/macaw-ui";
import { Trash2 } from "lucide-react";
import { ChangeEvent } from "react";
import { useIntl } from "react-intl";

import { messages } from "./messages";
import { Header, stringifyHeaders } from "./utils";

const nameSeparator = ":";
const nameInputPrefix = "name";
const valueInputPrefix = "value";

interface WebhookHeadersTableBodyProps {
  onChange: FormChange;
  headers: Header[];
}

export const WebhookHeadersTableBody = ({ onChange, headers }: WebhookHeadersTableBodyProps) => {
  const intl = useIntl();
  const updateWebhookItem = (target: EventTarget & HTMLTextAreaElement) => {
    const { name, value } = target;
    const [field, index] = name.split(nameSeparator);
    const item: Header = headers[index];

    // lowercase header name
    if (field === nameInputPrefix) {
      item[field] = value.toLowerCase();
    } else {
      item[field] = value;
    }

    return {
      item,
      index: parseInt(index, 10),
    };
  };
  const change = ({ target }: ChangeEvent<HTMLTextAreaElement>) => {
    const { item, index } = updateWebhookItem(target);

    onChange({
      target: {
        name: "customHeaders",
        value: stringifyHeaders(updateAtIndex(item, headers, index)),
      },
    });
  };

  return (
    <TableBody>
      {headers.map((field, fieldIndex) => (
        <TableRowLink data-test-id="field" key={fieldIndex}>
          <TableCell className="w-[250px] text-right pt-6 !pl-[3.2rem] pr-2 [&_.MuiFormHelperText-root]:m-0">
            <TextField
              InputProps={{
                classes: {
                  input: "py-3 px-4",
                },
              }}
              inputProps={{
                "aria-label": `${nameInputPrefix}${nameSeparator}${fieldIndex}`,
              }}
              name={`${nameInputPrefix}${nameSeparator}${fieldIndex}`}
              fullWidth
              onChange={change}
              value={field.name}
              error={field.error}
              helperText={(field.error && intl.formatMessage(messages.headerNameError)) || " "}
            />
          </TableCell>
          <TableCell className="pt-6 !pl-[3.2rem] pr-2 [&_.MuiFormHelperText-root]:m-0">
            <TextField
              InputProps={{
                classes: {
                  input: "py-3 px-4",
                },
              }}
              inputProps={{
                "aria-label": `${valueInputPrefix}${nameSeparator}${fieldIndex}`,
              }}
              name={`${valueInputPrefix}${nameSeparator}${fieldIndex}`}
              fullWidth
              onChange={change}
              value={field.value}
              helperText={" "}
            />
          </TableCell>
          <TableCell className="text-right [&:last-child]:w-[130px] [&:last-child]:pr-[3.2rem]">
            <IconButton
              variant="secondary"
              data-test-id={"delete-field-" + fieldIndex}
              onClick={() =>
                onChange({
                  target: {
                    name: "customHeaders",
                    value: stringifyHeaders(removeAtIndex(headers, fieldIndex)),
                  },
                })
              }
              size="medium">
              <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
            </IconButton>
          </TableCell>
        </TableRowLink>
      ))}
    </TableBody>
  );
};

WebhookHeadersTableBody.displayName = "WebhookHeadersTableRow";
