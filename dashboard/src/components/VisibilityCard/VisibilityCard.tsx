// @ts-strict-ignore
import ControlledCheckbox from "@dashboard/components/ControlledCheckbox";
import Hr from "@dashboard/components/Hr";
import RadioSwitchField from "@dashboard/components/RadioSwitchField";
import useCurrentDate from "@dashboard/hooks/useCurrentDate";
import useDateLocalize from "@dashboard/hooks/useDateLocalize";
import { ChangeEvent } from "@dashboard/hooks/useForm";
import { UserError } from "@dashboard/types";
import { getFieldError } from "@dashboard/utils/errors";
import { Box, Checkbox, RadioGroup, Text } from "@saleor/macaw-ui-next";
import { useState } from "react";
import * as React from "react";
import { useIntl } from "react-intl";

import { DashboardCard } from "../Card";
import { DateTimeTimezoneField } from "../DateTimeTimezoneField";
import FormSpacer from "../FormSpacer";
import DateVisibilitySelector from "./DateVisibilitySelector";
import { visibilityCardMessages } from "./messages";
import { isAvailableOrPublished } from "./utils";

interface Message {
  visibleLabel: string;
  hiddenLabel: string;
  visibleSecondLabel?: string;
  hiddenSecondLabel: string;
  availableLabel?: string;
  unavailableLabel?: string;
  availableSecondLabel?: string;
  setAvailabilityDateLabel?: string;
}

interface DateFields {
  publishedAt: string;
  availableForPurchaseAt?: string;
}

interface VisibilityCardProps {
  children?: React.ReactNode;
  data: DateFields & {
    availableForPurchaseAt?: string;
    isAvailableForPurchase?: boolean;
    isPublished: boolean;
    visibleInListings?: boolean;
  };
  errors: UserError[];
  disabled?: boolean;
  messages: Message;
  onChange: (event: ChangeEvent) => void;
}

const VisibilityCard = (props: VisibilityCardProps) => {
  const {
    children,
    data: {
      isAvailableForPurchase,
      availableForPurchaseAt,
      isPublished,
      publishedAt,
      visibleInListings,
    },
    errors,
    disabled,
    messages,
    onChange,
  } = props;
  const intl = useIntl();
  const localizeDate = useDateLocalize();
  const dateNow = useCurrentDate();

  const [isPublishedAt, setPublishedAt] = useState(!!publishedAt);

  const hasAvailableProps =
    isAvailableForPurchase !== undefined && availableForPurchaseAt !== undefined;
  const visibleMessage = (date: string) =>
    intl.formatMessage(visibilityCardMessages.sinceDate, {
      date: localizeDate(date),
    });
  const handleRadioFieldChange = (type: keyof DateFields) => (e: ChangeEvent) => {
    const { value } = e.target;

    if (!value) {
      onChange({
        target: {
          name: type,
          value: null,
        },
      });
    }

    return onChange(e);
  };

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage(visibilityCardMessages.title)}
        </DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        <RadioGroup
          disabled={disabled}
          name="isPublished"
          value={String(isPublished)}
          onValueChange={value => {
            onChange({
              target: {
                name: "publishedAt",
                value: value === "false" ? null : availableForPurchaseAt,
              },
            });
            onChange({
              target: {
                name: "isPublished",
                value: value === "true",
              },
            });
          }}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <RadioGroup.Item id={`isPublished-true`} value="true">
            <Box display="flex" __alignItems="baseline" gap={2}>
              <Text>{messages.visibleLabel}</Text>
              {isAvailableOrPublished({
                condition: isPublished,
                date: publishedAt,
                now: dateNow,
              }) && (
                <Text size={2} color="default2">
                  {visibleMessage(publishedAt)}
                </Text>
              )}
            </Box>
          </RadioGroup.Item>
          <RadioGroup.Item id={`isPublished-false`} value="false">
            <Box display="flex" __alignItems="baseline" gap={2}>
              <Text>{messages.hiddenLabel}</Text>
              {publishedAt && !isPublished && (
                <Text size={2} color="default2">
                  {messages.hiddenSecondLabel}
                </Text>
              )}
            </Box>
          </RadioGroup.Item>
        </RadioGroup>

        {!isPublished && (
          <Box display="flex" gap={1} flexDirection="column" alignItems="start" marginTop={2}>
            <Checkbox
              onCheckedChange={(checked: boolean) => setPublishedAt(checked)}
              checked={isPublishedAt}
            >
              {messages.setAvailabilityDateLabel}
            </Checkbox>

            {isPublishedAt && (
              <DateTimeTimezoneField
                label={intl.formatMessage(visibilityCardMessages.publishOn)}
                disabled={disabled}
                name="publishedAt"
                value={publishedAt || ""}
                onChange={value =>
                  onChange({
                    target: {
                      name: "publishedAt",
                      value: value,
                    },
                  })
                }
                //eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore todo
                error={getFieldError(errors, "isPublishedAt")}
                fullWidth
              />
            )}
          </Box>
        )}

        {getFieldError(errors, "isPublished") && (
          <>
            <FormSpacer />
            <Text color="critical1">{getFieldError(errors, "isPublished")?.message}</Text>
          </>
        )}
        {hasAvailableProps && (
          <>
            <Hr />
            <RadioSwitchField
              className="mt-2"
              disabled={disabled}
              error={!!getFieldError(errors, "isAvailableForPurchase")}
              firstOptionLabel={
                <>
                  <p className="mb-[5px] mt-0 leading-tight">{messages.availableLabel}</p>
                  {isAvailableOrPublished({
                    condition: isAvailableForPurchase,
                    date: availableForPurchaseAt,
                    now: dateNow,
                  }) && (
                    <span className="mb-4 text-xs text-text-disabled">
                      {visibleMessage(availableForPurchaseAt)}
                    </span>
                  )}
                </>
              }
              name={"isAvailableForPurchase" as keyof FormData}
              secondOptionLabel={
                <>
                  <p className="mb-[5px] mt-0 leading-tight">{messages.unavailableLabel}</p>
                  {availableForPurchaseAt && !isAvailableForPurchase && (
                    <span className="mb-4 text-xs text-text-disabled">{messages.availableSecondLabel}</span>
                  )}
                </>
              }
              value={isAvailableForPurchase}
              onChange={handleRadioFieldChange("availableForPurchaseAt")}
            />
            {!isAvailableForPurchase && (
              <DateVisibilitySelector
                buttonText={messages.setAvailabilityDateLabel}
                onInputClose={() =>
                  onChange({
                    target: { name: "availableForPurchase", value: null },
                  })
                }
              >
                <DateTimeTimezoneField
                  error={!!getFieldError(errors, "startDate")}
                  disabled={disabled}
                  label={intl.formatMessage(visibilityCardMessages.setAvailableOn)}
                  name="availableForPurchaseAt"
                  fullWidth
                  helperText={getFieldError(errors, "startDate")?.message}
                  value={availableForPurchaseAt || ""}
                  onChange={value =>
                    onChange({
                      target: {
                        name: "availableForPurchaseAt",
                        value,
                      },
                    })
                  }
                />
              </DateVisibilitySelector>
            )}
            {getFieldError(errors, "isAvailableForPurchase") && (
              <>
                <FormSpacer />
                <Text color="critical1">
                  {getFieldError(errors, "isAvailableForPurchase")?.message}
                </Text>
              </>
            )}
          </>
        )}
        {visibleInListings !== undefined && (
          <>
            <Hr />
            <ControlledCheckbox
              className="items-start mt-[10px]"
              name="visibleInListings"
              checked={!visibleInListings}
              disabled={disabled}
              label={
                <>
                  <p className="mb-[5px] mt-[9px] leading-tight">
                    {intl.formatMessage(visibilityCardMessages.hideInListings)}
                  </p>

                  <span className="mb-4 text-xs text-text-disabled">
                    {intl.formatMessage(visibilityCardMessages.hideInListingsDescription)}
                  </span>
                </>
              }
              onChange={event =>
                onChange({
                  ...event,
                  target: {
                    ...event.target,
                    value: !event.target.value,
                  },
                })
              }
            />
          </>
        )}
        <div className="[&_button]:mx-[9px] [&_label]:mt-5">{children}</div>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

VisibilityCard.displayName = "VisibilityCard";
export default VisibilityCard;
