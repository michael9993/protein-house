import Link from "@dashboard/components/Link";
import { IconButton } from "@dashboard/components/IconButton/IconButton";
import { Plus } from "lucide-react";
import { MutableRefObject, PropsWithChildren } from "react";

interface CardAddItemsFooterProps {
  title: string;
  onAdd: () => void;
  testIds: {
    link: string;
    button: string;
  };
  ref?: MutableRefObject<HTMLDivElement>;
}

const CardAddItemsFooter = ({
  title,
  onAdd,
  testIds,
  ref,
  children,
}: PropsWithChildren<CardAddItemsFooterProps>) => {
  return (
    <div className="py-2 flex flex-row justify-between items-center w-full relative" ref={ref}>
      <Link data-test-id={testIds.link} onClick={onAdd}>
        {title}
      </Link>
      <IconButton
        variant="secondary"
        data-test-id={testIds.button}
        color="primary"
        onClick={onAdd}
        size="medium">
        <Plus />
      </IconButton>
      {children}
    </div>
  );
};

export default CardAddItemsFooter;
