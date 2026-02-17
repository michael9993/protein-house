import Arrow from "@dashboard/components/Filter/Arrow";
import { FieldType, FilterFieldBaseProps } from "@dashboard/components/Filter/types";
import { Input } from "@saleor/macaw-ui-next";
import { FormattedMessage } from "react-intl";

import { commonFilterStyles, filterTestingContext } from "./utils";

type FilterNumericFieldProps = FilterFieldBaseProps<string, FieldType.number | FieldType.price> & {
  currencySymbol: string | undefined;
};

export const FilterNumericField = ({
  filter,
  onFilterPropertyChange,
  currencySymbol,
}: FilterNumericFieldProps) => {
  const classes = commonFilterStyles;
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
          type="number"
          endAdornment={filter.type === FieldType.price && currencySymbol}
          value={filter.value[0]}
          onChange={({ target: { value } }) =>
            handleChange(isMultiple ? [value, filter.value[1]] : [value])
          }
        />
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
              type="number"
              endAdornment={filter.type === FieldType.price && currencySymbol}
              value={filter.value[1]}
              onChange={event => handleChange([filter.value[0], event.target.value])}
            />
          </div>
        </>
      )}
    </>
  );
};
