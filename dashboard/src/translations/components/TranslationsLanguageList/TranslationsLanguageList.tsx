// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import ResponsiveTable from "@dashboard/components/ResponsiveTable";
import TableRowLink from "@dashboard/components/TableRowLink";
import { LanguageFragment } from "@dashboard/graphql";
import { languageEntitiesUrl } from "@dashboard/translations/urls";
import { cn } from "@dashboard/utils/cn";
import { TableBody, TableCell } from "@mui/material";
import { Skeleton } from "@saleor/macaw-ui-next";
import { FormattedMessage } from "react-intl";

import { maybe, renderCollection } from "../../../misc";

interface TranslationsLanguageListProps {
  languages: LanguageFragment[];
}

const TranslationsLanguageList = (props: TranslationsLanguageListProps) => {
  const { languages } = props;

  return (
    <DashboardCard>
      <DashboardCard.Content className="pl-0">
        <ResponsiveTable>
          <TableBody data-test-id="translation-list-view">
            {renderCollection(
              languages,
              language => (
                <TableRowLink
                  data-test-id={language ? language.code : "skeleton"}
                  className={cn(
                    "[&_.MuiTableCell-root]:!pl-6",
                    language && "cursor-pointer",
                  )}
                  hover={!!language}
                  key={language ? language.code : "skeleton"}
                  href={language && languageEntitiesUrl(language.code, {})}
                >
                  <TableCell className="capitalize">
                    {maybe<React.ReactNode>(() => language.language, <Skeleton />)}
                  </TableCell>
                </TableRowLink>
              ),
              () => (
                <TableRowLink>
                  <TableCell colSpan={1}>
                    <FormattedMessage id="ptPPVk" defaultMessage="No languages found" />
                  </TableCell>
                </TableRowLink>
              ),
            )}
          </TableBody>
        </ResponsiveTable>
      </DashboardCard.Content>
    </DashboardCard>
  );
};

TranslationsLanguageList.displayName = "TranslationsLanguageList";
export default TranslationsLanguageList;
