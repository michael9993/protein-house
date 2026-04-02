import { BaseError } from "./errors";

export function assertUnreachable(_value: never): never {
  throw new BaseError("Statement should be unreachable");
}
