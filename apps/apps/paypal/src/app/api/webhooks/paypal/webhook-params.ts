import { err, ok, Result } from "neverthrow";

export interface WebhookParams {
  saleorApiUrl: string;
  configurationId: string;
  appId: string;
}

export class WebhookParamsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookParamsError";
  }
}

export function parseWebhookParams(url: string): Result<WebhookParams, WebhookParamsError> {
  const parsedUrl = new URL(url);
  const saleorApiUrl = parsedUrl.searchParams.get("saleorApiUrl");
  const configurationId = parsedUrl.searchParams.get("configurationId");
  const appId = parsedUrl.searchParams.get("appId");

  if (!saleorApiUrl) {
    return err(new WebhookParamsError("Missing saleorApiUrl query param"));
  }
  if (!configurationId) {
    return err(new WebhookParamsError("Missing configurationId query param"));
  }
  if (!appId) {
    return err(new WebhookParamsError("Missing appId query param"));
  }

  return ok({ saleorApiUrl, configurationId, appId });
}
