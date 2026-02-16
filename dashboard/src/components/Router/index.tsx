import { getAppMountUri } from "@dashboard/config";
import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  createBrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from "react-router";

// Sentry React Router v7 browser tracing integration.
// Must be called before createBrowserRouter.
export const initSentryRouterIntegration = () =>
  Sentry.reactRouterV7BrowserTracingIntegration({
    useEffect,
    useLocation,
    useNavigationType,
    createRoutesFromChildren,
    matchRoutes,
  });

// Wrap createBrowserRouter with Sentry for route-level transaction tracking.
const sentryCreateBrowserRouter =
  Sentry.wrapCreateBrowserRouterV7(createBrowserRouter);

/**
 * Create the application router.
 * Uses createBrowserRouter (data router) so that useBlocker works
 * for form exit protection.
 */
export const createAppRouter = (element: React.ReactElement) =>
  sentryCreateBrowserRouter(
    [{ path: "*", element }],
    { basename: getAppMountUri() },
  );
