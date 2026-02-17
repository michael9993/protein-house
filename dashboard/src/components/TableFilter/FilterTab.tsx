import { Tab } from "@mui/material";

interface FilterTabProps {
  onClick: () => void;
  label: string;
  selected?: boolean;
  value?: number;
}

export const FilterTab = (props: FilterTabProps) => {
  const { onClick, label, selected, value } = props;

  return (
    <Tab
      disableRipple
      label={label}
      classes={{
        root: "min-w-[80px] opacity-100 pt-2 normal-case",
        wrapper: selected
          ? "text-base font-medium text-text-primary"
          : "text-base font-medium text-text-secondary hover:text-text-primary",
      }}
      onClick={onClick}
      value={value}
    />
  );
};
FilterTab.displayName = "FilterTab";
export default FilterTab;
