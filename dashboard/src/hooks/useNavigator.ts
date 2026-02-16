import { ExitFormDialogContext } from "@dashboard/components/Form/ExitFormDialogProvider";
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router";

export type NavigatorOpts = {
  replace?: boolean;
  preserveQs?: boolean;
  resetScroll?: boolean;
  state?: Record<string, unknown>;
};

export type UseNavigatorResult = (url: string, opts?: NavigatorOpts) => void;
function useNavigator(): UseNavigatorResult {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { shouldBlockNavigation } = useContext(ExitFormDialogContext);

  return (
    url: string,
    { replace = false, preserveQs = false, resetScroll = false, state } = {},
  ) => {
    if (shouldBlockNavigation()) {
      return;
    }

    const targetUrl = preserveQs ? url + search : url;

    navigate(targetUrl, { replace, state });

    if (resetScroll) {
      window.scrollTo({ behavior: "smooth", top: 0 });
    }
  };
}

export default useNavigator;
