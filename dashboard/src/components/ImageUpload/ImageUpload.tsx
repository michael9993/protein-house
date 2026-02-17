// @ts-strict-ignore
import { cn } from "@dashboard/utils/cn";
import { ImageIcon } from "@saleor/macaw-ui";
import { Text } from "@saleor/macaw-ui-next";
import * as React from "react";
import { FormattedMessage } from "react-intl";

import Dropzone from "../Dropzone";

interface ImageUploadProps {
  children?: (props: { isDragActive: boolean }) => React.ReactNode;
  className?: string;
  disableClick?: boolean;
  isActiveClassName?: string;
  iconContainerClassName?: string;
  iconContainerActiveClassName?: string;
  hideUploadIcon?: boolean;
  onImageUpload: (file: FileList) => void;
}

const ImageUpload = (props: ImageUploadProps) => {
  const {
    children,
    className,
    disableClick,
    iconContainerActiveClassName,
    iconContainerClassName,
    isActiveClassName,
    hideUploadIcon,
    onImageUpload,
  } = props;

  return (
    <Dropzone disableClick={disableClick} onDrop={onImageUpload}>
      {({ isDragActive, getInputProps, getRootProps }) => (
        <>
          <div
            {...getRootProps()}
            className={cn(
              "py-10 text-center",
              isDragActive && "bg-primary/10 text-primary",
              isDragActive && isActiveClassName,
              className,
            )}
          >
            {!hideUploadIcon && (
              <div
                className={cn(
                  iconContainerClassName,
                  isDragActive && iconContainerActiveClassName,
                )}
              >
                <input {...getInputProps()} className="hidden" accept="image/*" />
                <ImageIcon className="h-[32px] mx-auto w-[32px]" />
                <Text display="block" fontWeight="bold" textTransform="uppercase" fontSize={3}>
                  <FormattedMessage
                    id="NxeDbG"
                    defaultMessage="Drop here to upload"
                    description="image upload"
                  />
                </Text>
              </div>
            )}
          </div>
          {children && children({ isDragActive })}
        </>
      )}
    </Dropzone>
  );
};

ImageUpload.displayName = "ImageUpload";
export default ImageUpload;
