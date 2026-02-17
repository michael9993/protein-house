import { cn } from "@dashboard/utils/cn";
import { Avatar as MuiAvatar } from "@mui/material";
import { ImageIcon } from "@saleor/macaw-ui";
import { Text } from "@saleor/macaw-ui-next";

interface AvatarImageProps {
  initials?: string;
  thumbnail?: string;
  avatarProps?: string;
}

const AvatarImage = ({ initials, thumbnail, avatarProps }: AvatarImageProps) => {
  const avatarClassName = cn(
    "bg-transparent border border-divider rounded-sm text-grey-500 inline-flex p-1",
    avatarProps,
  );

  if (!thumbnail && initials) {
    return (
      <MuiAvatar className={avatarClassName}>
        <Text size={6} fontWeight="bold" lineHeight={3}>
          {initials}
        </Text>
      </MuiAvatar>
    );
  }

  if (!thumbnail) {
    return (
      <MuiAvatar className={avatarClassName}>
        <ImageIcon color="primary" data-test-id="imageIcon" />
      </MuiAvatar>
    );
  }

  return <MuiAvatar className={avatarClassName} src={thumbnail} />;
};

export default AvatarImage;
