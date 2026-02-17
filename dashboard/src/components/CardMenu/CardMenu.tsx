// @ts-strict-ignore
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { SaleorThrobber } from "@dashboard/components/Throbber";
import { cn } from "@dashboard/utils/cn";
import { ClickAwayListener, Grow, MenuItem, MenuList, Paper, Popper } from "@mui/material";
import { IconButtonProps } from "@saleor/macaw-ui";
import { Text } from "@saleor/macaw-ui-next";
import { EllipsisVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import { FormattedMessage } from "react-intl";

import { IconButton } from "../IconButton";
import { cardMenuMessages as messages } from "./messages";

const ITEM_HEIGHT = 48;

export interface CardMenuItem {
  disabled?: boolean;
  label: string;
  testId?: string;
  onSelect: <T>(params?: T) => void;
  loading?: boolean;
  withLoading?: boolean;
  hasError?: boolean;
  Icon?: React.ReactElement;
}

interface CardMenuProps {
  className?: string;
  disabled?: boolean;
  menuItems: CardMenuItem[];
  outlined?: boolean;
  Icon?: React.ElementType<any>;
  IconButtonProps?: IconButtonProps;
  autoFocusItem?: boolean;
  showMenuIcon?: boolean;
}

/**
 * @deprecated use [`TopNav.Menu`](https://github.com/saleor/saleor-dashboard/blob/main/src/components/AppLayout/TopNav/Menu.tsx) instead
 */
const CardMenu = (props: CardMenuProps) => {
  const {
    className,
    disabled,
    menuItems,
    outlined,
    Icon: icon,
    IconButtonProps = {},
    autoFocusItem = true,
    showMenuIcon = false,
    ...rest
  } = props;
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => setOpen(prevOpen => !prevOpen);
  const handleClose = (event: React.MouseEvent<EventTarget>) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };
  const handleListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    }
  };
  const prevOpen = useRef(open);

  useEffect(() => {
    if (prevOpen.current && !open) {
      anchorRef.current!.focus();
    }

    prevOpen.current = open;
  }, [open]);
  useEffect(() => {
    const hasAnyItemsLoadingOrWithError = menuItems
      ?.filter(({ withLoading }) => withLoading)
      ?.some(({ loading, hasError }) => loading || hasError);

    if (!hasAnyItemsLoadingOrWithError) {
      setOpen(false);
    }
  }, [menuItems]);

  const handleMenuClick = (index: number) => {
    const selectedItem = menuItems[index];

    selectedItem.onSelect();

    if (!selectedItem.withLoading) {
      setOpen(false);
    }
  };
  const isWithLoading = menuItems.some(({ withLoading }) => withLoading);
  const DefaultIcon = () => (
    <EllipsisVertical size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
  );
  const Icon = icon ?? DefaultIcon;

  return (
    <div className={className} {...rest}>
      <IconButton
        data-test-id="show-more-button"
        aria-label="More"
        aria-owns={open ? "long-menu" : null}
        aria-haspopup="true"
        disabled={disabled}
        ref={anchorRef}
        onClick={handleToggle}
        variant={outlined ? "primary" : "secondary"}
        state={open ? "active" : "default"}
        {...IconButtonProps}
        size="medium">
        <Icon onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
      </IconButton>
      <Popper
        placement="bottom-end"
        className="z-[1]"
        open={open}
        anchorEl={anchorRef.current}
        transition
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === "bottom" ? "right top" : "right bottom",
              overflowY: "auto",
            }}
          >
            <Paper className="mt-4 overflow-y-scroll" style={{ maxHeight: ITEM_HEIGHT * 4.5 }} elevation={8}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  autoFocusItem={autoFocusItem && open}
                  id="menu-list-grow"
                  onKeyDown={handleListKeyDown}
                >
                  {menuItems.map((menuItem, menuItemIndex) => (
                    <MenuItem
                      data-test-id={menuItem.testId}
                      disabled={menuItem.loading || menuItem.disabled}
                      onClick={() => handleMenuClick(menuItemIndex)}
                      key={menuItem.label}
                      button
                    >
                      <div
                        className={cn(
                          className,
                          isWithLoading && "w-full grid grid-cols-[1fr_24px] gap-4 items-center justify-end",
                        )}
                      >
                        {menuItem.loading ? (
                          <>
                            <Text fontSize={3}>
                              <FormattedMessage {...messages.cardMenuItemLoading} />
                            </Text>
                            <SaleorThrobber size={24} />
                          </>
                        ) : (
                          <Text>
                            {showMenuIcon && menuItem.Icon} {menuItem.label}
                          </Text>
                        )}
                      </div>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
};

CardMenu.displayName = "CardMenu";
export default CardMenu;
