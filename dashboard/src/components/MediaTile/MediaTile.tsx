import { IconButton } from "@dashboard/components/IconButton";
import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { cn } from "@dashboard/utils/cn";
import { Pencil, Trash2 } from "lucide-react";
import * as React from "react";

import { SaleorThrobber } from "../Throbber";

interface MediaTileBaseProps {
  media: {
    alt: string | null;
    url: string;
    type?: string;
    oembedData?: string;
  };
  disableOverlay?: boolean;
  loading?: boolean;
  onDelete?: () => void;
  onEdit?: (event: React.ChangeEvent<any>) => void;
}

type MediaTileProps = MediaTileBaseProps &
  (
    | {
        onEdit?: React.MouseEventHandler<HTMLButtonElement>;
        editHref?: never;
      }
    | {
        onEdit?: never;
        editHref?: string;
      }
  );

const MediaTile = (props: MediaTileProps) => {
  const { loading, onDelete, onEdit, editHref, media, disableOverlay = false } = props;
  const parsedMediaOembedData = media?.oembedData ? JSON.parse(media.oembedData) : null;
  const mediaUrl = parsedMediaOembedData?.thumbnail_url || media.url;

  return (
    <div
      className="relative h-[148px] w-[148px] overflow-hidden rounded-lg border border-divider bg-background-paper p-1 group"
      data-test-id="product-image"
    >
      <div
        className={cn(
          "absolute left-0 top-0 hidden h-[148px] w-[148px] cursor-move bg-background-default opacity-80 group-hover:block [.dragged_&]:block",
          loading && "flex items-center justify-center",
          disableOverlay && "!hidden",
        )}
      >
        {loading ? (
          <SaleorThrobber size={32} />
        ) : (
          <div className="flex justify-end">
            {(onEdit || editHref) && (
              <IconButton
                href={editHref}
                hoverOutline={false}
                variant="secondary"
                className="m-4 mr-0 cursor-pointer border-none bg-transparent p-0 text-saleor-main-1 hover:text-saleor-active-1"
                onClick={onEdit}
                size="medium">
                <Pencil size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                variant="secondary"
                hoverOutline={false}
                className="m-4 cursor-pointer border-none bg-transparent p-0 text-saleor-main-1 hover:text-saleor-active-1"
                onClick={onDelete}
                size="medium">
                <Trash2 size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />
              </IconButton>
            )}
          </div>
        )}
      </div>
      <img className="h-full w-full object-contain select-none" src={mediaUrl} alt={media.alt!} />
    </div>
  );
};

MediaTile.displayName = "MediaTile";
export default MediaTile;
