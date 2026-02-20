// @ts-strict-ignore
import { TopNav } from "@dashboard/components/AppLayout/TopNav";
import { DetailPageLayout } from "@dashboard/components/Layouts";
import { UserFragment } from "@dashboard/graphql";
import { sectionNames } from "@dashboard/intl";
import { Box } from "@saleor/macaw-ui-next";
import { ChevronRight } from "lucide-react";
import * as React from "react";
import { useIntl } from "react-intl";
import { Link } from "react-router";

import VersionInfo from "../components/VersionInfo";
import { MenuSection } from "./types";
import { hasUserMenuItemPermissions } from "./utils";

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  "data-test-id"?: string;
}

function SettingsRow({ icon, title, description, ...props }: SettingsRowProps) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-4 hover:bg-[var(--mu-colors-background-default2)] transition-colors cursor-pointer rounded-lg group"
      {...props}
    >
      <div className="w-10 h-10 rounded-lg bg-[var(--mu-colors-background-default2)] flex items-center justify-center shrink-0 text-[var(--mu-colors-text-default1)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[var(--mu-colors-text-default1)]">{title}</div>
        <div className="text-xs text-[var(--mu-colors-text-default2)] mt-0.5">{description}</div>
      </div>
      <ChevronRight
        size={16}
        className="shrink-0 text-[var(--mu-colors-text-default3)] group-hover:text-[var(--mu-colors-text-default1)] transition-colors"
      />
    </div>
  );
}

interface VersionInfoData {
  dashboardVersion: string;
  coreVersion: string;
}

interface ConfigurationPageProps {
  menu: MenuSection[];
  user: UserFragment;
  versionInfo: VersionInfoData;
}

export const ConfigurationPage = (props: ConfigurationPageProps) => {
  const {
    menu: menus,
    user,
    versionInfo: { dashboardVersion, coreVersion },
  } = props;
  const intl = useIntl();

  const visibleMenus = menus.filter(menu =>
    menu.menuItems.some(menuItem => hasUserMenuItemPermissions(menuItem, user)),
  );

  return (
    <DetailPageLayout gridTemplateColumns={1} withSavebar={false}>
      <TopNav title={intl.formatMessage(sectionNames.configuration)}>
        <div className="hidden sm:block">
          <VersionInfo dashboardVersion={dashboardVersion} coreVersion={coreVersion} />
        </div>
      </TopNav>
      <DetailPageLayout.Content data-test-id="configuration-menu">
        <Box paddingX={6} __maxWidth={"720px"} margin="auto">
          <div className="flex flex-col gap-8 py-6">
            {visibleMenus.map((menu, menuIndex) => (
              <div key={menuIndex}>
                <div className="text-xs font-semibold uppercase tracking-wider text-[var(--mu-colors-text-default2)] px-4 pb-2">
                  {menu.label}
                </div>
                <div className="border border-[var(--mu-colors-border-default1)] rounded-xl overflow-hidden divide-y divide-[var(--mu-colors-border-default1)]">
                  {menu.menuItems
                    .filter(
                      menuItem =>
                        hasUserMenuItemPermissions(menuItem, user) && !menuItem?.hidden,
                    )
                    .map((item, itemIndex) => (
                      <Link
                        className="block"
                        to={item.url}
                        key={`${item.title}-${itemIndex}`}
                      >
                        <SettingsRow
                          icon={item.icon}
                          title={item.title}
                          description={item.description}
                          data-test-id={
                            item.testId +
                            "-settings-subsection-" +
                            item.title.toLowerCase()
                          }
                        />
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </Box>
      </DetailPageLayout.Content>
    </DetailPageLayout>
  );
};

ConfigurationPage.displayName = "ConfigurationPage";
