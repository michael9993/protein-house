import { SaleorThrobber } from "@dashboard/components/Throbber";
import { useAppFrameReferences } from "@dashboard/extensions/popup-frame-reference";
import { AppDetailsUrlQueryParams } from "@dashboard/extensions/urls";
import { useAllFlags } from "@dashboard/featureFlags";
import { cn } from "@dashboard/utils/cn";
import { DashboardEventFactory } from "@saleor/app-sdk/app-bridge";
import { useCallback, useEffect, useRef } from "react";

import { AppIFrame } from "./AppIFrame";
import { useAppActions } from "./useAppActions";
import { useAppDashboardUpdates } from "./useAppDashboardUpdates";
import { useTokenRefresh } from "./useTokenRefresh";
import { useUpdateAppToken } from "./useUpdateAppToken";

interface Props {
  src: string;
  appToken: string;
  appId: string;
  className?: string;
  params?: AppDetailsUrlQueryParams;
  refetch?: () => void;
  dashboardVersion: string;
  coreVersion?: string;
  onError?: () => void;
  target: "POPUP" | "WIDGET" | "APP_PAGE";
}

const getOrigin = (url: string) => new URL(url).origin;

export const AppFrame = ({
  src,
  appToken,
  appId,
  className,
  params,
  onError,
  refetch,
  dashboardVersion,
  coreVersion = "",
  target,
}: Props) => {
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const appOrigin = getOrigin(src);
  const flags = useAllFlags();
  const { setIframe, clearIframe } = useAppFrameReferences();
  /**
   * React on messages from App
   */
  const { postToExtension, handshakeDone, setHandshakeDone } = useAppActions(
    frameRef.current,
    appOrigin,
    appId,
    appToken,
    {
      core: coreVersion,
      dashboard: dashboardVersion,
    },
  );

  /**
   * Listen to Dashboard context like theme or locale and inform app about it
   */
  useAppDashboardUpdates(frameRef.current, appOrigin, handshakeDone, appId);
  useTokenRefresh(appToken, refetch);

  const handleLoad = useCallback(() => {
    setIframe(frameRef.current!, true, target);

    postToExtension(
      DashboardEventFactory.createHandshakeEvent(appToken, 1, {
        core: coreVersion,
        dashboard: dashboardVersion,
      }),
    );
    setHandshakeDone(true);
  }, [appToken, postToExtension, setHandshakeDone]);

  useUpdateAppToken({
    postToExtension,
    appToken,
    /**
     * If app is not ready, ignore this flow
     */
    enabled: handshakeDone,
  });

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        clearIframe(frameRef?.current);
      }
    };
  }, []);

  return (
    <>
      {!handshakeDone && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
          <SaleorThrobber />
        </div>
      )}
      <AppIFrame
        ref={frameRef}
        src={src}
        appId={appId}
        featureFlags={flags}
        params={params}
        onLoad={handleLoad}
        onError={onError}
        className={cn("h-full w-full border-none", className, !handshakeDone && "invisible")}
      />
    </>
  );
};
