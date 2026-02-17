// @ts-strict-ignore
import HorizontalSpacer from "@dashboard/components/HorizontalSpacer";
import { UseFormResult } from "@dashboard/hooks/useForm";
import { RequireOnlyOne } from "@dashboard/misc";
import commonErrorMessages from "@dashboard/utils/errors/common";
import { TextField } from "@mui/material";
import Hue from "@uiw/react-color-hue";
import Saturation from "@uiw/react-color-saturation";
import convert from "color-convert";
import { RGB } from "color-convert/conversions";
import { useEffect, useState } from "react";
import { useIntl } from "react-intl";

export type ColorPickerProps<T = any> = Pick<
  UseFormResult<T>,
  "setError" | "errors" | "clearErrors" | "data"
> & { onColorChange: (hex: string) => void };

export const ColorPicker = ({
  clearErrors,
  setError,
  errors,
  onColorChange,
  data,
}: ColorPickerProps) => {
  const intl = useIntl();
  const [hex, setHex] = useState<string>(data.value ? data.value.replace("#", "") : "000000");
  const [hue, setHue] = useState<number>(convert.hex.hsv(hex)[0]);
  const [, s, v] = convert.hex.hsv(hex);
  const [r, g, b] = convert.hex.rgb(hex);
  const isValidColor = hex.match(/^(?:[0-9a-fA-F]{3}){1,2}$/);
  const handleRGBChange = (rgbColor: RequireOnlyOne<{ r: string; g: string; b: string }>) => {
    const getValue = (val: string): number => {
      if (!val) {
        return 0;
      }

      const parsedVal = parseInt(val, 10);

      return parsedVal > 255 ? 255 : parsedVal;
    };

    setHex(
      convert.rgb.hex([getValue(rgbColor.r), getValue(rgbColor.g), getValue(rgbColor.b)] as RGB),
    );
  };
  const handleHEXChange = (hexColor: string) => setHex(hexColor.replace(/ |#/g, ""));

  useEffect(() => {
    if (isValidColor) {
      if ("value" in errors) {
        clearErrors("value");
      }

      onColorChange(`#${hex}`);
    } else {
      if (!("value" in errors)) {
        setError("value", intl.formatMessage(commonErrorMessages.invalid));
      }
    }
  }, [errors, hex]);

  return (
    <div className="flex">
      <div>
        <Saturation
          hsva={{ h: hue, s, v, a: 1 }}
          onChange={({ h, s, v }) => setHex(convert.hsv.hex([h, s, v]))}
          className="!w-[220px] !h-[220px]"
        />
      </div>
      <HorizontalSpacer spacing={4} />
      <div>
        <Hue
          hue={hue}
          onChange={({ h }) => {
            setHue(h);
            setHex(convert.hsv.hex([h, s, v]));
          }}
          direction="vertical"
          height="220px"
          width="16px"
        />
      </div>
      <HorizontalSpacer spacing={4} />
      <div>
        <TextField
          className="whitespace-nowrap w-[170px] mb-2 [&_input]:text-right [&_input]:p-[15px]"
          InputProps={{ startAdornment: "R" }}
          value={r}
          onChange={event => handleRGBChange({ r: event.target.value })}
        />
        <TextField
          className="whitespace-nowrap w-[170px] mb-2 [&_input]:text-right [&_input]:p-[15px]"
          InputProps={{ startAdornment: "G" }}
          value={g}
          onChange={event => handleRGBChange({ g: event.target.value })}
        />
        <TextField
          className="whitespace-nowrap w-[170px] mb-2 [&_input]:text-right [&_input]:p-[15px]"
          InputProps={{ startAdornment: "B" }}
          value={b}
          onChange={event => handleRGBChange({ b: event.target.value })}
        />
        <TextField
          error={!isValidColor}
          helperText={errors?.value}
          className="whitespace-nowrap w-[170px] mb-2 [&_input]:text-right [&_input]:p-[15px]"
          InputProps={{ startAdornment: "HEX" }}
          inputProps={{ pattern: "[A-Za-z0-9]{6}", maxLength: 7 }}
          value={`#${hex}`}
          onChange={event => handleHEXChange(event.target.value)}
        />
      </div>
    </div>
  );
};
