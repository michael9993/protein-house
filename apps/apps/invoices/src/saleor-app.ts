import { APL } from "@saleor/app-sdk/APL";
import { FileAPL } from "@saleor/app-sdk/APL/file";
import { SaleorApp } from "@saleor/app-sdk/saleor-app";

const aplType = process.env.APL ?? "file";

export let apl: APL;

switch (aplType) {
  case "file":
    apl = new FileAPL();
    break;

  default: {
    throw new Error("Invalid APL config. Only 'file' APL is supported for now.");
  }
}

export const saleorApp = new SaleorApp({
  apl,
});

export const REQUIRED_SALEOR_VERSION = ">=3.11.7 <4";

