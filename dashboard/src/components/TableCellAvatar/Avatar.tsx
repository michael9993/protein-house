import { cn } from "@dashboard/utils/cn";
import * as React from "react";

import AvatarImage from "./AvatarImage";

export const AVATAR_MARGIN = 40;

export interface AvatarProps {
  initials?: string;
  thumbnail?: string;
  alignRight?: boolean;
  avatarProps?: string;
  children?: React.ReactNode | React.ReactNode[];
  badge?: React.ReactNode;
  className?: string;
}

const Avatar = ({
  children,
  alignRight,
  initials,
  thumbnail,
  avatarProps,
  badge,
  className,
}: AvatarProps) => {
  return (
    <div
      className={cn(
        "flex items-center",
        alignRight && "justify-end",
        className,
      )}
    >
      {badge}
      <AvatarImage thumbnail={thumbnail} initials={initials} avatarProps={avatarProps} />
      {!alignRight && <div className="ml-4 w-full self-center">{children}</div>}
    </div>
  );
};

export default Avatar;
