import { cn } from "@dashboard/utils/cn";
import { ImageIcon } from "@saleor/macaw-ui";
import { Text } from "@saleor/macaw-ui-next";

interface AvatarImageProps {
  initials?: string;
  thumbnail?: string;
  avatarProps?: string;
}

const AvatarImage = ({ initials, thumbnail, avatarProps }: AvatarImageProps) => {
  const avatarClassName = cn(
    "bg-transparent border border-divider rounded-sm text-grey-500 inline-flex items-center justify-center overflow-hidden p-1",
    avatarProps,
  );

  if (!thumbnail && initials) {
    return (
      <div className={avatarClassName}>
        <Text size={6} fontWeight="bold" lineHeight={3}>
          {initials}
        </Text>
      </div>
    );
  }

  if (!thumbnail) {
    return (
      <div className={avatarClassName}>
        <ImageIcon color="primary" data-test-id="imageIcon" />
      </div>
    );
  }

  return (
    <div className={avatarClassName}>
      <img src={thumbnail} className="w-full h-full object-cover" alt="" />
    </div>
  );
};

export default AvatarImage;
