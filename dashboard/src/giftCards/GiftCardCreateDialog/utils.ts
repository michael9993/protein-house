// @ts-strict-ignore
import { IMessage } from "@dashboard/components/messages";
import { GiftCardCreateMutation, TimePeriodTypeEnum } from "@dashboard/graphql";
import commonErrorMessages from "@dashboard/utils/errors/common";
import { IntlShape } from "react-intl";

import { GiftCardCreateCommonFormData } from "../GiftCardBulkCreateDialog/types";
import { giftCardUpdateFormMessages } from "../GiftCardsList/messages";
import { giftCardCreateMessages as messages } from "./messages";

const addToCurrentDate = (
  currentDate: number,
  expiryPeriodAmount: number,
  unit: "day" | "week" | "month" | "year",
): Date => {
  const d = new Date(currentDate);

  switch (unit) {
    case "day":
      d.setDate(d.getDate() + expiryPeriodAmount);
      break;
    case "week":
      d.setDate(d.getDate() + expiryPeriodAmount * 7);
      break;
    case "month":
      d.setMonth(d.getMonth() + expiryPeriodAmount);
      break;
    case "year":
      d.setFullYear(d.getFullYear() + expiryPeriodAmount);
      break;
  }

  return d;
};

const formatDateYMD = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const getExpiryPeriodTerminationDate = (
  currentDate: number,
  expiryPeriodType: TimePeriodTypeEnum,
  expiryPeriodAmount = 0,
): Date | null => {
  switch (expiryPeriodType) {
    case TimePeriodTypeEnum.DAY:
      return addToCurrentDate(currentDate, expiryPeriodAmount, "day");
    case TimePeriodTypeEnum.WEEK:
      return addToCurrentDate(currentDate, expiryPeriodAmount, "week");
    case TimePeriodTypeEnum.MONTH:
      return addToCurrentDate(currentDate, expiryPeriodAmount, "month");
    case TimePeriodTypeEnum.YEAR:
      return addToCurrentDate(currentDate, expiryPeriodAmount, "year");
    default:
      return null;
  }
};

const getGiftCardExpiryError = (intl: IntlShape): IMessage => ({
  title: intl.formatMessage(giftCardUpdateFormMessages.giftCardInvalidExpiryDateHeader),
  text: intl.formatMessage(giftCardUpdateFormMessages.giftCardInvalidExpiryDateContent),
  status: "error",
});

export const getGiftCardCreateOnCompletedMessage = (
  errors: GiftCardCreateMutation["giftCardCreate"]["errors"],
  intl: IntlShape,
  successMessage?: IMessage,
): IMessage => {
  const hasExpiryError = errors.some(error => error.field === "expiryDate");
  const successGiftCardMessage = successMessage || {
    status: "success",
    text: intl.formatMessage(messages.createdSuccessAlertTitle),
  };

  if (hasExpiryError) {
    return getGiftCardExpiryError(intl);
  }

  return errors?.length
    ? {
        status: "error",
        text: intl.formatMessage(commonErrorMessages.unknownError),
      }
    : successGiftCardMessage;
};

export const getGiftCardExpiryInputData = (
  {
    expirySelected,
    expiryType,
    expiryDate,
    expiryPeriodAmount,
    expiryPeriodType,
  }: GiftCardCreateCommonFormData,
  currentDate: number,
): string => {
  if (!expirySelected) {
    return;
  }

  if (expiryType === "EXPIRY_PERIOD") {
    const terminationDate = getExpiryPeriodTerminationDate(
      currentDate,
      expiryPeriodType,
      expiryPeriodAmount,
    );

    return terminationDate ? formatDateYMD(terminationDate) : undefined;
  }

  return expiryDate;
};
