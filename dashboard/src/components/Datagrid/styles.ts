import { Theme } from "@glideapps/glide-data-grid";
import { useTheme } from "@saleor/macaw-ui-next";
import clsx from "clsx";
import { useMemo } from "react";

import css from "./styles.module.css";

export const cellHeight = 40;
// Width for a single action button container (column picker, single row action)
export const singleActionWidth = cellHeight;
// Default width for the row action bar (can be overridden via Datagrid prop)
export const rowActionBarWidth = singleActionWidth;

interface UseStylesProps {
  actionButtonPosition?: "left" | "right";
  showMetadataButton?: boolean;
}

export interface DatagridClasses {
  root: string;
  actionBtnBar: string;
  columnPicker: string;
  columnPickerBackground: string;
  ghostIcon: string;
  portal: string;
  datagrid: string;
  rowActionBar: string;
  rowActionBarWithItems: string;
  rowActionBarScrolledToRight: string;
  rowAction: string;
  rowColumnGroup: string;
  rowActionScrolledToRight: string;
  columnGroupFixer: string;
  editorContainer: string;
  rowActionBarShadow: string;
  rowActionBarShadowActive: string;
  rowActionSelected: string;
  /** Inline styles for actionBtnBar dynamic positioning */
  actionBtnBarStyle: React.CSSProperties;
  /** Inline styles for rowAction dynamic grid */
  rowActionStyle: React.CSSProperties;
}

function useStyles(props: UseStylesProps = {}): DatagridClasses {
  const { actionButtonPosition, showMetadataButton } = props;

  return useMemo(
    () => ({
      root: css.root,
      actionBtnBar: css.actionBtnBar,
      columnPicker: css.columnPicker,
      columnPickerBackground: css.columnPickerBackground,
      ghostIcon: css.ghostIcon,
      portal: css.portal,
      datagrid: css.datagrid,
      rowActionBar: css.rowActionBar,
      rowActionBarWithItems: css.rowActionBarWithItems,
      rowActionBarScrolledToRight: css.rowActionBarScrolledToRight,
      rowAction: clsx(css.rowAction, showMetadataButton && css.rowActionWithMetadata),
      rowColumnGroup: css.rowColumnGroup,
      rowActionScrolledToRight: css.rowActionScrolledToRight,
      columnGroupFixer: css.columnGroupFixer,
      editorContainer: css.editorContainer,
      rowActionBarShadow: css.rowActionBarShadow,
      rowActionBarShadowActive: css.rowActionBarShadowActive,
      rowActionSelected: css.rowActionSelected,
      actionBtnBarStyle: {
        left: actionButtonPosition === "left" ? 0 : "auto",
        right: actionButtonPosition === "right" ? 0 : "auto",
      },
      rowActionStyle: {
        gridTemplateColumns: showMetadataButton ? "1fr auto 1fr" : "1fr",
      },
    }),
    [actionButtonPosition, showMetadataButton],
  );
}

export function useFullScreenStyles(): { fullScreenContainer: string } {
  return useMemo(
    () => ({
      fullScreenContainer: css.fullScreenContainer,
    }),
    [],
  );
}

export function useDatagridTheme(readonly?: boolean, hasHeaderClickable?: boolean) {
  const { themeValues } = useTheme();
  const datagridTheme = useMemo(
    (): Partial<Theme> => ({
      accentColor: "transparent",
      accentLight: themeValues.colors.background.default2,
      accentFg: "transparent",
      bgCell: themeValues.colors.background.default1,
      bgHeader: themeValues.colors.background.default1,
      bgHeaderHasFocus: "transparent",
      bgHeaderHovered: "transparent",
      bgBubbleSelected: themeValues.colors.background.default1,
      borderColor: themeValues.colors.border.default1,
      fontFamily: "'Inter var', sans-serif",
      baseFontStyle: `${themeValues.fontWeight.regular} ${themeValues.fontSize[3]}`,
      headerFontStyle: `${themeValues.fontWeight.medium} ${themeValues.fontSize[2]}`,
      editorFontSize: themeValues.fontSize[3],
      textMedium: themeValues.colors.text.default1,
      textGroupHeader: themeValues.colors.text.default1,
      textBubble: themeValues.colors.background.default1,
      textDark: themeValues.colors.text.default1,
      textLight: themeValues.colors.text.default2,
      textHeader: themeValues.colors.text.default1,
      textHeaderSelected: themeValues.colors.text.default1,
      fgIconHeader: themeValues.colors.text.default1,
      cellHorizontalPadding: 8,
      cellVerticalPadding: 8,
      lineHeight: 20,
    }),
    [themeValues, hasHeaderClickable],
  );
  const readonylDatagridTheme = useMemo(
    () => ({
      ...datagridTheme,
      accentColor: "transparent",
      accentLight: themeValues.colors.background.default2,
    }),
    [themeValues, datagridTheme],
  );

  return readonly ? readonylDatagridTheme : datagridTheme;
}

export default useStyles;
