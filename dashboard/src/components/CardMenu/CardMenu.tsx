// @ts-strict-ignore
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { SaleorThrobber } from "@dashboard/components/Throbber";
import { useClickOutside } from "@dashboard/hooks/useClickOutside";
import { cn } from "@dashboard/utils/cn";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const handleToggle = () => setOpen(prevOpen => !prevOpen);

  useClickOutside([anchorRef, menuRef], () => setOpen(false));

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
    <div className={cn("relative", className)} {...rest}>
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
      {open && (
        <div ref={menuRef} className="absolute right-0 top-full z-[1] mt-1">
          <div
            className="rounded bg-[var(--mu-colors-background-default1)] shadow-lg overflow-y-auto"
            style={{ maxHeight: ITEM_HEIGHT * 4.5 }}
          >
            <ul
              role="menu"
              id="menu-list-grow"
              onKeyDown={handleListKeyDown}
              className="list-none p-1 m-0"
            >
              {menuItems.map((menuItem, menuItemIndex) => (
                <li
                  key={menuItem.label}
                  role="menuitem"
                  data-test-id={menuItem.testId}
                  aria-disabled={menuItem.loading || menuItem.disabled || undefined}
                  onClick={() => !(menuItem.loading || menuItem.disabled) && handleMenuClick(menuItemIndex)}
                  className={cn(
                    "px-4 py-2 cursor-pointer select-none rounded",
                    (menuItem.loading || menuItem.disabled)
                      ? "opacity-50 pointer-events-none"
                      : "hover:bg-[var(--mu-colors-background-interactiveNeutralHighlightDefault)]",
                  )}
                >
                  <div
                    className={cn(
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
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

CardMenu.displayName = "CardMenu";
export default CardMenu;
