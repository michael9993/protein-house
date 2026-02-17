// @ts-strict-ignore
import { DashboardCard } from "@dashboard/components/Card";
import { cn } from "@dashboard/utils/cn";
import { Skeleton } from "@saleor/macaw-ui-next";
import { defineMessages, useIntl } from "react-intl";

const messages = defineMessages({
  allMedia: {
    id: "XUU9sU",
    defaultMessage: "All Media",
    description: "section header",
  },
});

interface ProductMediaNavigationProps {
  disabled: boolean;
  media?: Array<{
    id: string;
    url: string;
    alt?: string;
    type?: string;
    oembedData?: string;
  }>;
  highlighted?: string;
  onRowClick: (id: string) => () => void;
}

const ProductMediaNavigation = (props: ProductMediaNavigationProps) => {
  const { highlighted, media, onRowClick } = props;
  const intl = useIntl();

  return (
    <DashboardCard className="mb-4">
      <DashboardCard.Header>
        <DashboardCard.Title>{intl.formatMessage(messages.allMedia)}</DashboardCard.Title>
      </DashboardCard.Header>
      <DashboardCard.Content>
        {!media ? (
          <Skeleton />
        ) : (
          <div className="grid gap-x-4 gap-y-2 grid-cols-4">
            {media.map(mediaObj => {
              const mediaObjOembedData = JSON.parse(mediaObj?.oembedData);
              const mediaUrl = mediaObjOembedData?.thumbnail_url || mediaObj.url;

              return (
                <div
                  className={cn(
                    "border-2 border-default-1 rounded-lg cursor-pointer h-12 overflow-hidden p-1 relative",
                    mediaObj.id === highlighted && "border-primary",
                  )}
                  onClick={onRowClick(mediaObj.id)}
                  key={mediaObj.id}
                >
                  <img
                    className="h-full object-contain select-none w-full"
                    src={mediaUrl}
                    alt={mediaObj.alt}
                  />
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard.Content>
    </DashboardCard>
  );
};

ProductMediaNavigation.displayName = "ProductMediaNavigation";
export default ProductMediaNavigation;
