import { cn } from "@dashboard/utils/cn";

interface FilterTabProps {
  onClick: () => void;
  label: string;
  selected?: boolean;
  value?: number;
}

export const FilterTab = (props: FilterTabProps) => {
  const { onClick, label, selected } = props;

  return (
    <button
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "min-w-[80px] pt-2 px-4 pb-3 border-b-2 bg-transparent cursor-pointer normal-case text-base font-medium",
        selected
          ? "text-text-primary border-[var(--mu-colors-background-interactiveNeutralDefault)]"
          : "text-text-secondary hover:text-text-primary border-transparent",
      )}
    >
      {label}
    </button>
  );
};
FilterTab.displayName = "FilterTab";
export default FilterTab;
