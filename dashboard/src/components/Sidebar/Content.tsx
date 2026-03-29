import { useCloud } from "@dashboard/auth/hooks/useCloud";
import { AllRipplesModal } from "@dashboard/ripples/components/AllRipplesModal";
import { useAllRipplesModalState } from "@dashboard/ripples/state";
import { Box } from "@saleor/macaw-ui-next";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { Menu } from "./menu";
import { MountingPoint } from "./MountingPoint";
import { useSidebarCollapsed } from "./SidebarContext";
import { UserInfo } from "./user";

interface SidebarContentProps {
  forceExpanded?: boolean;
}

export const SidebarContent = ({ forceExpanded }: SidebarContentProps) => {
  const { isAuthenticatedViaCloud } = useCloud();
  const { isModalOpen, setModalState } = useAllRipplesModalState();
  const { collapsed, toggleCollapsed } = useSidebarCollapsed();
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <Box
      backgroundColor="default2"
      as="aside"
      height="100%"
      display="grid"
      __gridTemplateRows="auto 1fr auto"
      overflow="hidden"
    >
      <MountingPoint />
      <Menu collapsed={isCollapsed} />
      <Box>
        {!forceExpanded && (
          <Box
            as="button"
            display="flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            borderWidth={0}
            backgroundColor="default2"
            width="100%"
            paddingY={2}
            borderTopWidth={1}
            borderColor="default1"
            borderTopStyle="solid"
            onClick={toggleCollapsed}
            data-test-id="sidebar-collapse-toggle"
            className="hover:bg-[var(--mu-colors-background-default1Hovered)]"
          >
            <Box color="default2" __width={20} __height={20} display="flex" alignItems="center" justifyContent="center">
              {isCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </Box>
          </Box>
        )}
        <UserInfo collapsed={isCollapsed} />
      </Box>
      <AllRipplesModal
        open={isModalOpen}
        onChange={open => {
          setModalState(open);
        }}
      />
    </Box>
  );
};
