// @ts-strict-ignore
import { SubmitPromise } from "@dashboard/hooks/useForm";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker, useLocation, useNavigate } from "react-router";

import { ExitFormDialogData, FormData, FormsData } from "./types";

const defaultValues = {
  isDirty: false,
  showDialog: false,
  blockNav: true,
  navAction: null as { pathname: string; search: string } | null,
  enableExitDialog: false,
  isSubmitting: false,
  formsData: {},
};

/** @deprecated Use react-hook-form instead */
export function useExitFormDialogProvider() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(defaultValues.showDialog);
  const isSubmitDisabled = useRef(false);
  const setIsSubmitDisabled = (status: boolean) => {
    isSubmitDisabled.current = status;
  };
  const isSubmitting = useRef(defaultValues.isSubmitting);
  const formsData = useRef<FormsData>({});
  const blockNav = useRef(defaultValues.blockNav);
  const navAction = useRef<{ pathname: string; search: string } | null>(defaultValues.navAction);
  const enableExitDialog = useRef(defaultValues.enableExitDialog);
  const currentLocation = useRef(location);
  const setIsSubmitting = (value: boolean) => {
    setEnableExitDialog(!value);
    isSubmitting.current = value;
  };
  const setEnableExitDialog = (value: boolean) => {
    // dialog should never be toggled to enabled during form submission
    if (isSubmitting.current) {
      return;
    }

    enableExitDialog.current = value;
  };
  const setDefaultFormsData = () => {
    formsData.current = defaultValues.formsData;
  };
  const setCurrentLocation = (newLocation: { pathname: string; search: string }) => {
    currentLocation.current = newLocation;
  };
  const setFormData = (id: symbol, newData: Partial<FormData>) => {
    const updatedFormData = { ...formsData.current[id], ...newData };

    formsData.current = {
      ...formsData.current,
      [id]: updatedFormData,
    };
  };
  // Set either on generic form load or on every custom form data change
  // but doesn't cause re-renders
  const setSubmitRef = <T extends () => SubmitPromise<any[]>>(id: symbol, submitFn: T) => {
    setFormData(id, { submitFn });
  };
  const setIsDirty = (id: symbol, value: boolean) => {
    // in case of race conitions between forms and transitions
    if (!formsData.current[id]) {
      return;
    }

    setFormData(id, { isDirty: value });

    if (value) {
      setEnableExitDialog(true);
    }
  };
  const setBlockNav = (value: boolean) => (blockNav.current = value);
  const setDefaultNavAction = () => (navAction.current = defaultValues.navAction);
  const setStateDefaultValues = () => {
    setIsSubmitting(defaultValues.isSubmitting);
    setDefaultFormsData();
    setShowDialog(defaultValues.showDialog);
    setBlockNav(defaultValues.blockNav);
    setEnableExitDialog(defaultValues.enableExitDialog);
    setDefaultNavAction();
  };
  const getFormsDataValuesArray = () =>
    Object.getOwnPropertySymbols(formsData.current).map(key => formsData.current[key]);
  const hasAnyFormsDirty = () => getFormsDataValuesArray().some(({ isDirty }) => isDirty);
  const shouldBlockNav = useCallback(() => {
    if (!enableExitDialog.current || !hasAnyFormsDirty()) {
      return false;
    }

    return blockNav.current;
  }, []);

  // Store blocker ref for proceed/reset
  const blockerRef = useRef<ReturnType<typeof useBlocker> | null>(null);

  // useBlocker replaces history.block() — requires createBrowserRouter (data router).
  const blocker = useBlocker(({ currentLocation: curr, nextLocation: next }) => {
    // Allow query-string-only changes (same pathname)
    if (curr.pathname === next.pathname) {
      return false;
    }

    return shouldBlockNav();
  });

  blockerRef.current = blocker;

  useEffect(() => {
    if (blocker.state === "blocked") {
      navAction.current = blocker.location;
      setShowDialog(true);
    }
  }, [blocker.state, blocker.location]);

  // Keep currentLocation in sync
  useEffect(() => {
    currentLocation.current = location;
  }, [location]);

  const continueNavigation = () => {
    setBlockNav(false);
    setDefaultFormsData();

    if (navAction.current) {
      setCurrentLocation(navAction.current);
    }

    // Use blocker.proceed() to continue the blocked navigation
    if (blockerRef.current?.state === "blocked") {
      blockerRef.current.proceed();
    }

    setStateDefaultValues();
  };
  const handleLeave = () => {
    continueNavigation();
  };
  const handleClose = () => {
    // Reset the blocker so navigation stays on current page
    if (blockerRef.current?.state === "blocked") {
      blockerRef.current.reset();
    }

    setDefaultNavAction();
    setShowDialog(false);
  };
  // Used to prevent race conditions from places such as
  // create pages with navigation on mutation completed
  const shouldBlockNavigation = () => !!navAction.current;
  const providerData: ExitFormDialogData = {
    setIsDirty,
    shouldBlockNavigation,
    setEnableExitDialog,
    setExitDialogSubmitRef: setSubmitRef,
    setIsSubmitting,
    setIsSubmitDisabled,
    leave: handleLeave,
  };

  return {
    providerData,
    showDialog,
    handleLeave,
    handleClose,
    shouldBlockNav,
    isSubmitDisabled,
  };
}
