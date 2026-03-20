import { AppContext } from "@/lib/app-context";
import { BaseError } from "@/lib/errors";

class ResponseMessageFormatter {
  formatMessage(message: string, error?: { publicMessage?: string; publicCode?: string }): string {
    if (error?.publicMessage) {
      return `${message}: ${error.publicMessage}`;
    }
    return message;
  }
}

export abstract class SuccessWebhookResponse {
  readonly statusCode = 200;
  readonly appContext: AppContext;
  protected messageFormatter = new ResponseMessageFormatter();

  constructor(appContext: AppContext) {
    this.appContext = appContext;
  }

  abstract getResponse(): Response;
}

export abstract class ErrorWebhookResponse {
  readonly statusCode: number;
  readonly appContext: AppContext;

  constructor(appContext: AppContext, statusCode = 500) {
    this.appContext = appContext;
    this.statusCode = statusCode;
  }

  abstract getResponse(): Response;
}

export class AppIsNotConfiguredResponse extends ErrorWebhookResponse {
  readonly message = "App is not configured for this channel";

  constructor(appContext: AppContext) {
    super(appContext, 500);
  }

  getResponse(): Response {
    return Response.json({ message: this.message }, { status: this.statusCode });
  }
}

export class BrokenAppResponse extends ErrorWebhookResponse {
  readonly message: string;

  constructor(appContext: AppContext, error: BaseError | Error) {
    super(appContext, 500);
    this.message = error.message;
  }

  getResponse(): Response {
    return Response.json({ message: this.message }, { status: this.statusCode });
  }
}

export class MalformedRequestResponse extends ErrorWebhookResponse {
  constructor(appContext: AppContext, _error: BaseError | Error) {
    super(appContext, 400);
  }

  getResponse(): Response {
    return Response.json({ message: "Malformed request" }, { status: this.statusCode });
  }
}

export class UnhandledErrorResponse extends ErrorWebhookResponse {
  constructor(appContext: AppContext, _error: BaseError | Error) {
    super(appContext, 500);
  }

  getResponse(): Response {
    return Response.json({ message: "Unhandled error" }, { status: this.statusCode });
  }
}
