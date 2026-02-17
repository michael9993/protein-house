import { Button } from "@dashboard/components/Button";
import { DashboardCard } from "@dashboard/components/Card";
import Hr from "@dashboard/components/Hr";
import ImageUpload from "@dashboard/components/ImageUpload";
import MediaTile from "@dashboard/components/MediaTile";
import { CategoryDetailsFragment } from "@dashboard/graphql";
import { commonMessages } from "@dashboard/intl";
import { Skeleton, Textarea } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import { CategoryUpdateData } from "../CategoryUpdatePage/form";

interface CategoryBackgroundProps {
  data: CategoryUpdateData;
  image: CategoryDetailsFragment["backgroundImage"] | undefined | null;
  onChange: (event: React.ChangeEvent<any>) => void;
  onImageDelete: () => void;
  onImageUpload: (file: File | null) => void;
}

const CategoryBackground = (props: CategoryBackgroundProps) => {
  const intl = useIntl();
  const anchor = React.useRef<HTMLInputElement>(null);
  const { data, onImageUpload, image, onChange, onImageDelete } = props;
  const handleImageUploadButtonClick = () => anchor.current?.click();

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
          <Button variant="tertiary" onClick={handleImageUploadButtonClick}>
            <FormattedMessage {...commonMessages.uploadImage} />
          </Button>
          <input
            className="hidden"
            id="fileUpload"
            onChange={({ target: { files } }) => onImageUpload(files && files[0])}
            type="file"
            ref={anchor}
            accept="image/*"
          />
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

CategoryBackground.displayName = "CategoryBackground";
export default CategoryBackground;
