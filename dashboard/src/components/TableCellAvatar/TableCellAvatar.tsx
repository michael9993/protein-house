import { TableCell, type TableCellProps } from "@dashboard/components/Table";
import { cn } from "@dashboard/utils/cn";

import Avatar, { AvatarProps } from "./Avatar";

interface TableCellAvatarProps extends TableCellProps, Omit<AvatarProps, "children"> {
  className?: string;
  avatarClassName?: string;
}

const TableCellAvatar = (props: TableCellAvatarProps) => {
  const { className, avatarClassName, ...rest } = props;

  return (
    <TableCell
      className={cn("w-[1%] pr-6 [&:not(:first-child)]:pl-0", className)}
      data-test-id="table-cell-avatar"
      {...rest}
    >
      <Avatar className={avatarClassName} {...rest} />
    </TableCell>
  );
};

export default TableCellAvatar;
