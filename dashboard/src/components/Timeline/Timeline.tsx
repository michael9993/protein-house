// @ts-strict-ignore
import { useUser } from "@dashboard/auth";
import { Button } from "@dashboard/components/Button";
import { getUserInitials } from "@dashboard/misc";
import { TextField } from "@mui/material";
import { sprinkles, vars } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { DashboardCard } from "../Card";
import { UserAvatar } from "../UserAvatar";

interface TimelineProps {
  children?: React.ReactNode;
}

interface TimelineAddNoteProps {
  disabled?: boolean;
  message: string;
  reset: () => void;
  onChange: (event: React.ChangeEvent<any>) => any;
  onSubmit: (event: React.FormEvent<any>) => any;
}

export const Timeline = (props: TimelineProps) => {
  const { children } = props;

  return <div className="ml-[20px] pl-[21px] relative">{children}</div>;
};

export const TimelineAddNote = (props: TimelineAddNoteProps) => {
  const { message, onChange, onSubmit, reset, disabled } = props;
  const { user } = useUser();
  const intl = useIntl();
  const submit = e => {
    reset();
    onSubmit(e);
  };

  return (
    <div className="mb-6 top-0 left-[-19px] right-0">
      <DashboardCard.Content paddingX={0}>
        <UserAvatar
          url={user?.avatar?.url}
          initials={getUserInitials(user)}
          className={sprinkles({
            position: "absolute",
            top: 0,
          })}
          style={{ left: -19 }}
        />
        <TextField
          disabled={disabled}
          className="[&>div]:p-[0_0_0_14px] [&_textarea::placeholder]:!opacity-100"
          style={{ background: vars.colors.background.default1 }}
          placeholder={intl.formatMessage({
            id: "3evXPj",
            defaultMessage: "Leave your note here...",
          })}
          onChange={onChange}
          value={message}
          name="message"
          fullWidth
          multiline
          InputProps={{
            endAdornment: (
              <Button
                className="p-[7px] rounded-tl-none rounded-bl-none"
                disabled={disabled}
                onClick={e => submit(e)}
              >
                <FormattedMessage
                  id="v/1VA6"
                  defaultMessage="Send"
                  description="add order note, button"
                />
              </Button>
            ),
          }}
          variant="outlined"
        />
      </DashboardCard.Content>
    </div>
  );
};

Timeline.displayName = "Timeline";
export default Timeline;
