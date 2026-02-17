// @ts-strict-ignore

import Arrow from "@dashboard/components/Filter/Arrow";
import { FieldType, FilterFieldBaseProps } from "@dashboard/components/Filter/types";
import { splitDateTime } from "@dashboard/misc";
import { Input } from "@saleor/macaw-ui-next";
import { FormattedMessage } from "react-intl";

import {
  commonFilterStyles,
  filterTestingContext,
  getDateFilterValue,
  getDateTimeFilterValue,
} from "./utils";

type FilterDateTimeFieldProps = FilterFieldBaseProps<string, FieldType.dateTime | FieldType.date>;

export const FilterDateTimeField = ({
  filter,
  onFilterPropertyChange,
}: FilterDateTimeFieldProps) => {
  const classes = commonFilterStyles;
  const isDateTime = filter.type === FieldType.dateTime;
  const isMultiple = filter.multiple;
  const handleChange = (value: string[]) =>
    onFilterPropertyChange({
      payload: {
        name: filter.name,
        update: {
          value,
        },
      },
      type: "set-property",
    });

  return (
    <>
      <div className={classes.inputRange}>
        <div>
          <Arrow className={classes.arrow} />
        </div>
        <Input
          size="small"
          {...(isMultiple && { "data-test-range-type": "min" })}
          data-test-id={filterTestingContext + filter.name}
          name={filter.name + (isMultiple ? "_min" : "")}
          className={classes.input}
          type="date"
          value={splitDateTime(filter.value[0]).date}
          onChange={event => {
            const value = getDateFilterValue(event.target.value, filter.value[0], isDateTime);

            handleChange(isMultiple ? [value, filter.value[1]] : [value]);
          }}
        />
        {isDateTime && (
          <Input
            size="small"
            data-test-id={filterTestingContext + filter.name}
            data-test-range-type="time_min"
            className={`${classes.input} ${classes.inputTime}`}
            name={filter.name + (isMultiple ? "_time_min" : "")}
            type="time"
            value={splitDateTime(filter.value[0]).time}
            onChange={event => {
              const value = getDateTimeFilterValue(filter.value[0], event.target.value);

              handleChange(isMultiple ? [value, filter.value[1]] : [value]);
            }}
          />
        )}
      </div>
      {filter.multiple && (
        <>
          <div className={classes.inputRange}>
            <div className={classes.spacer} />
            <span className={classes.andLabel}>
              <FormattedMessage
                id="34F7Jk"
                defaultMessage="and"
                description="filter range separator"
              />
            </span>
          </div>
          <div className={classes.inputRange}>
            <div className={classes.spacer} />
            <Input
              size="small"
              data-test-id={filterTestingContext + filter.name}
              data-test-range-type="max"
              name={filter.name + "_max"}
              className={classes.input}
              type="date"
              value={splitDateTime(filter.value[1]).date}
              onChange={event =>
                handleChange([
                  filter.value[0],
                  getDateFilterValue(event.target.value, filter.value[1], isDateTime),
                ])
              }
            />
            {isDateTime && (
              <Input
                size="small"
                data-test-id={filterTestingContext + filter.name}
                className={`${classes.input} ${classes.inputTime}`}
                data-test-range-type="time_max"
                name={filter.name + "_time_max"}
                type="time"
                value={splitDateTime(filter.value[1]).time}
                onChange={event =>
                  handleChange([
                    filter.value[0],
                    getDateTimeFilterValue(filter.value[1], event.target.value),
                  ])
                }
              />
            )}
          </div>
        </>
      )}
    </>
  );
};
