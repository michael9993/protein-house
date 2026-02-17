// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import Checkbox from "@dashboard/components/Checkbox";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import TableCellHeader from "@dashboard/components/TableCellHeader";
import TableHead from "@dashboard/components/TableHead";
import TableRowLink from "@dashboard/components/TableRowLink";
import { UserAvatar } from "@dashboard/components/UserAvatar";
import { PermissionGroupMemberFragment } from "@dashboard/graphql";
import { commonStatusMessages } from "@dashboard/intl";
import { getUserInitials, getUserName, renderCollection, stopPropagation } from "@dashboard/misc";
import { sortMembers } from "@dashboard/permissionGroups/sort";
import { MembersListUrlSortField } from "@dashboard/permissionGroups/urls";
import { ListActions, SortPage } from "@dashboard/types";
import { getArrowDirection } from "@dashboard/utils/sort";
import { TableBody, TableCell } from "@dashboard/components/Table";
import { Box, Button, Skeleton, Text } from "@saleor/macaw-ui-next";
import { Trash2 } from "lucide-react";
import { FormattedMessage, useIntl } from "react-intl";

const numberOfColumns = 4;

interface PermissionGroupProps extends ListActions, SortPage<MembersListUrlSortField> {
  users: PermissionGroupMemberFragment[];
  disabled: boolean;
  onUnassign: (ida: string[]) => void;
  onAssign: () => void;
}

const PermissionGroupMemberList = (props: PermissionGroupProps) => {
  const {
    disabled,
    users,
    onUnassign,
    onAssign,
    onSort,
    toggle,
    toolbar,
    isChecked,
    selected,
    toggleAll,
    sort,
  } = props;
  const intl = useIntl();
  const members = [...users].sort(sortMembers(sort?.sort, sort?.asc));

  return (
    <DashboardCard data-test-id="permission-group-members-section">
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage({
            id: "lGlDEH",
            defaultMessage: "Group members",
            description: "header",
          })}
        </DashboardCard.Title>

        <DashboardCard.Toolbar>
          <Button
            data-test-id="assign-members"
            variant="secondary"
            onClick={onAssign}
            disabled={disabled}
          >
            <FormattedMessage id="OhFGpX" defaultMessage="Assign members" description="button" />
          </Button>
        </DashboardCard.Toolbar>
      </DashboardCard.Header>
      {members?.length === 0 ? (
        <DashboardCard.Content className="text-center" data-test-id="no-members-text">
          <Text color="default2">
            <FormattedMessage
              id="gVD1os"
              defaultMessage="You haven’t assigned any member to this permission group yet."
              description="empty list message"
            />
          </Text>
          <Text color="default2">
            <FormattedMessage
              id="zD7/M6"
              defaultMessage="Please use Assign Members button to do so."
              description="empty list message"
            />
          </Text>
        </DashboardCard.Content>
      ) : (
        <ResponsiveTable>
          <TableHead
            colSpan={numberOfColumns}
            selected={selected}
            disabled={disabled}
            items={members}
            toggleAll={toggleAll}
            toolbar={toolbar}
          >
            <TableCellHeader
              className="flex items-center gap-2"
              arrowPosition="right"
              onClick={() => onSort(MembersListUrlSortField.name)}
              direction={
                sort?.sort === MembersListUrlSortField.name
                  ? getArrowDirection(sort.asc)
                  : undefined
              }
            >
              <FormattedMessage
                id="W32xfN"
                defaultMessage="Name"
                description="staff member full name"
              />
            </TableCellHeader>
            <TableCellHeader
              className="lg:w-[300px]"
              arrowPosition="right"
              onClick={() => onSort(MembersListUrlSortField.email)}
              direction={
                sort?.sort === MembersListUrlSortField.email
                  ? getArrowDirection(sort.asc)
                  : undefined
              }
            >
              <FormattedMessage id="xxQxLE" defaultMessage="Email Address" />
            </TableCellHeader>
            <TableCellHeader textAlign="right">
              <FormattedMessage id="wL7VAE" defaultMessage="Actions" />
            </TableCellHeader>
          </TableHead>
          <TableBody data-test-id="assigned-members-table">
            {renderCollection(
              members,
              user => {
                const isSelected = user ? isChecked(user.id) : false;

                return (
                  <TableRowLink
                    data-test-id="assigned-member-row"
                    hover={!!user}
                    selected={isSelected}
                    key={user ? user.id : "skeleton"}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected}
                        disabled={disabled}
                        disableClickPropagation
                        onChange={() => toggle(user.id)}
                      />
                    </TableCell>
                    <TableCell className="flex items-center gap-2">
                      <UserAvatar initials={getUserInitials(user)} url={user?.avatar?.url} />
                      <Box display="flex" flexDirection="column">
                        <Text data-test-id="member-name">{getUserName(user) || <Skeleton />}</Text>
                        <Text size={2} color="default2">
                          {!user ? (
                            <Skeleton />
                          ) : user.isActive ? (
                            intl.formatMessage(commonStatusMessages.active)
                          ) : (
                            intl.formatMessage(commonStatusMessages.notActive)
                          )}
                        </Text>
                      </Box>
                    </TableCell>
                    <TableCell className="lg:w-[300px]">
                      {user?.email || <Skeleton />}
                    </TableCell>
                    <TableCell className="text-right lg:w-[120px]">
                      {user ? (
                        <>
                          <Button
                            icon={
                              <Trash2
                                size={iconSize.small}
                                strokeWidth={iconStrokeWidthBySize.small}
                              />
                            }
                            variant="secondary"
                            data-test-id="remove-user"
                            disabled={disabled}
                            onClick={stopPropagation(() => onUnassign([user.id]))}
                            marginLeft="auto"
                          />
                        </>
                      ) : (
                        <Skeleton />
                      )}
                    </TableCell>
                  </TableRowLink>
                );
              },
              () => (
                <TableRowLink>
                  <TableCell colSpan={numberOfColumns}>
                    <FormattedMessage id="qrWOxx" defaultMessage="No members found" />
                  </TableCell>
                </TableRowLink>
              ),
            )}
          </TableBody>
        </ResponsiveTable>
      )}
    </DashboardCard>
  );
};

PermissionGroupMemberList.displayName = "PermissionGroupMemberList";
export default PermissionGroupMemberList;
