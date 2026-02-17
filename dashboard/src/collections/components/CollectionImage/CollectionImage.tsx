import { DashboardCard } from "@dashboard/components/Card";
import Hr from "@dashboard/components/Hr";
import ImageUpload from "@dashboard/components/ImageUpload";
import MediaTile from "@dashboard/components/MediaTile";
import { CollectionDetailsFragment } from "@dashboard/graphql";
import { commonMessages } from "@dashboard/intl";
import { Button, Skeleton, Textarea } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage, useIntl } from "react-intl";

interface CollectionImageProps {
  data: {
    backgroundImageAlt: string;
  };
  image: CollectionDetailsFragment["backgroundImage"];
  onChange: (event: React.ChangeEvent<any>) => void;
  onImageDelete: () => void;
  onImageUpload: (file: File) => void;
}

export const CollectionImage = (props: CollectionImageProps) => {
  const { data, onImageUpload, image, onChange, onImageDelete } = props;
  const anchor = React.useRef<HTMLInputElement | null>(null);
  const intl = useIntl();
  const handleImageUploadButtonClick = () => anchor?.current?.click();

  return (
    <DashboardCard>
      <DashboardCard.Header>
        <DashboardCard.Title>
          {intl.formatMessage({
            id: "DP6b8U",
            defaultMessage: "Background Image (optional)",
            description: "section header",
          })}
        </DashboardCard.Title>
        <DashboardCard.Toolbar>
          <>
            <Button
              variant="secondary"
              onClick={handleImageUploadButtonClick}
              data-test-id="upload-image-button"
            >
              <FormattedMessage {...commonMessages.uploadImage} />
            </Button>
            <input
              className="hidden"
              id="fileUpload"
              onChange={event => event?.target?.files && onImageUpload(event.target.files[0])}
              type="file"
              ref={anchor}
              accept="image/*"
            />
          </>
        </DashboardCard.Toolbar>
      </DashboardCard.Header>

      {image === undefined ? (
        <DashboardCard.Content>
          <div>
            <div className="bg-white border border-border-default1 rounded-lg h-[148px] justify-self-start overflow-hidden p-4 relative w-[148px]">
              <Skeleton />
            </div>
          </div>
        </DashboardCard.Content>
      ) : image === null ? (
        <ImageUpload onImageUpload={files => onImageUpload(files[0])} />
      ) : (
        <DashboardCard.Content>
          <MediaTile media={image} onDelete={onImageDelete} />
        </DashboardCard.Content>
      )}
      {image && (
        <>
          <Hr />
          <DashboardCard.Content>
            <Textarea
              size="small"
              name="backgroundImageAlt"
              label={intl.formatMessage(commonMessages.description)}
              helperText={intl.formatMessage({
                id: "0iMYc+",
                defaultMessage: "(Optional)",
                description: "field is optional",
              })}
              value={data.backgroundImageAlt}
              onChange={onChange}
            />
          </DashboardCard.Content>
        </>
      )}
    </DashboardCard>
  );
};

CollectionImage.displayName = "CollectionImage";
