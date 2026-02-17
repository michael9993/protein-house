// @ts-strict-ignore
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { DetailPageLayout } from "@dashboard/components/Layouts";
import { UserFragment } from "@dashboard/graphql";
import { sectionNames } from "@dashboard/intl";
import { NavigationCard } from "@saleor/macaw-ui";
import { Box, Text } from "@saleor/macaw-ui-next";
import { useIntl } from "react-intl";
import { Link } from "react-router";

import VersionInfo from "../components/VersionInfo";
import { MenuSection } from "./types";
import { hasUserMenuItemPermissions } from "./utils";

interface VersionInfo {
  dashboardVersion: string;
  coreVersion: string;
}

interface ConfigurationPageProps {
  menu: MenuSection[];
  user: UserFragment;
  versionInfo: VersionInfo;
}

export const ConfigurationPage = (props: ConfigurationPageProps) => {
  const {
    menu: menus,
    user,
    versionInfo: { dashboardVersion, coreVersion },
  } = props;
  const intl = useIntl();

  return (
    <DetailPageLayout gridTemplateColumns={1} withSavebar={false}>
      <TopNav title={intl.formatMessage(sectionNames.configuration)}>
        <div className="hidden sm:block">
          <VersionInfo dashboardVersion={dashboardVersion} coreVersion={coreVersion} />
        </div>
      </TopNav>
      <DetailPageLayout.Content data-test-id="configuration-menu">
        <Box paddingX={6} __maxWidth={"1024px"} margin="auto">
          {menus
            .filter(menu =>
              menu.menuItems.some(menuItem => hasUserMenuItemPermissions(menuItem, user)),
            )
            .map((menu, menuIndex) => (
              <div className="grid gap-8 grid-cols-[1fr_3fr] max-lg:grid-cols-1 py-8" key={menuIndex}>
                <div className="pb-5">
                  <Text>{menu.label}</Text>
                </div>
                <div className="grid gap-8 grid-cols-2">
                  {menu.menuItems
                    .filter(
                      menuItem => hasUserMenuItemPermissions(menuItem, user) && !menuItem?.hidden,
                    )
                    .map((item, itemIndex) => (
                      <Link
                        className="contents mb-8"
                        to={item.url}
                        key={`${item.title}-${itemIndex}`}
                      >
                        <NavigationCard
                          className="border border-[var(--color-border-default1)] h-[130px] !shadow-none [&_.MuiCardContent-root]:rounded-[var(--borderRadius-3)]"
                          key={itemIndex}
                          icon={item.icon}
                          title={item.title}
                          description={item.description}
                          data-test-id={
                            item.testId + "-settings-subsection-" + item.title.toLowerCase()
                          }
                        />
                      </Link>
                    ))}
                </div>
              </div>
            ))}
        </Box>
      </DetailPageLayout.Content>
    </DetailPageLayout>
  );
};

ConfigurationPage.displayName = "ConfigurationPage";
