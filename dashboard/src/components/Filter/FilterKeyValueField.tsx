import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { KeyValue } from "@dashboard/types";
import { Button, IconButton } from "@saleor/macaw-ui";
import { Input } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { useIntl } from "react-intl";

import { keyValueMessages } from "./messages";
import { FieldType, FilterFieldBaseProps } from "./types";
// @eslint-ignore-next-line
const getUpdateArrayFn =
  <T,>(key: "key" | "value") =>
  (array: T[], index: number, value: string) => {
    const item = array[index];

    return [...array.slice(0, index), { ...item, [key]: value }, ...array.slice(index + 1)];
  };
const updateKeyFn = getUpdateArrayFn<KeyValue>("key");
const updateValueFn = getUpdateArrayFn<KeyValue>("value");
const createEmptyPair = (array: KeyValue[]) => [...array, { key: "" }];

type FilterKeyValueFieldProps<K extends string = string> = FilterFieldBaseProps<
  K,
  FieldType.keyValue
>;

export const FilterKeyValueField = <K extends string = string>({
  filter,
  onFilterPropertyChange,
}: FilterKeyValueFieldProps<K>) => {
  const intl = useIntl();
  const values = filter.value?.length ? filter.value : ([{ key: "" }] as KeyValue[]);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-1 mb-2">
        {values.map((innerField, index) => (
          <div className="flex items-center gap-1" key={`${innerField.key}-${index}`}>
            <Input
              size="small"
              name={filter.name}
              label={intl.formatMessage(keyValueMessages.key)}
              value={innerField.key}
              onChange={event =>
                onFilterPropertyChange({
                  payload: {
                    name: filter.name,
                    update: {
                      value: updateKeyFn(values, index, event.target.value),
                    },
                  },
                  type: "set-property",
                })
              }
            />
            <Input
              size="small"
              name={filter.name}
              label={intl.formatMessage(keyValueMessages.value)}
              value={innerField.value ?? ""}
              onChange={event =>
                onFilterPropertyChange({
                  payload: {
                    name: filter.name,
                    update: {
                      value: updateValueFn(values, index, event.target.value),
                    },
                  },
                  type: "set-property",
                })
              }
            />
            <IconButton
              variant="secondary"
              className="ml-1 -mr-3"
              onClick={() => {
                onFilterPropertyChange({
                  payload: {
                    name: filter.name,
                    update: {
                      value: values.filter((_, i) => i !== index),
                    },
                  },
                  type: "set-property",
                });
              }}
              size="medium">
              <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
            </IconButton>
          </div>
        ))}
      </div>
      <Button
        className="self-end"
        color="primary"
        onClick={() => {
          onFilterPropertyChange({
            payload: {
              name: filter.name,
              update: {
                value: createEmptyPair(values),
              },
            },
            type: "set-property",
          });
        }}
      >
        {intl.formatMessage(keyValueMessages.add)}
      </Button>
    </div>
  );
};
