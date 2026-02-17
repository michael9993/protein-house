import "@saleor/macaw-ui-next/style";
import "./index.css";

import { ApolloProvider } from "@apollo/client";
import { createAppRouter } from "@dashboard/components/Router";
import { AppExtensionPopupProvider } from "@dashboard/extensions/components/AppExtensionContext/AppExtensionContextProvider";
import { ExtensionsPaths, extensionsSection } from "@dashboard/extensions/urls";
import { PermissionEnum } from "@dashboard/graphql";
import useAppState from "@dashboard/hooks/useAppState";
import { pageListPath } from "@dashboard/modeling/urls";
import { modelTypesPath } from "@dashboard/modelTypes/urls";
import { refundsSettingsPath } from "@dashboard/refundsSettings/urls";
import { structuresListPath } from "@dashboard/structures/urls";
import { ThemeProvider } from "@dashboard/theme";
import { StyledEngineProvider } from "@mui/material/styles";
import { OnboardingProvider } from "@dashboard/welcomePage/WelcomePageOnboarding/onboardingContext";
import { ThemeProvider as LegacyThemeProvider } from "@saleor/macaw-ui";
import { SaleorProvider } from "@saleor/sdk";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import TagManager from "react-gtm-module";
import { useIntl } from "react-intl";
import { Navigate, Route, RouterProvider, Routes as RouterRoutes } from "react-router";

import { attributeSection } from "./attributes/urls";
import AuthProvider from "./auth/AuthProvider";
import LoginLoading from "./auth/components/LoginLoading/LoginLoading";
import { SectionGuard } from "./auth/components/SectionRoute";
import { useAuthRedirection } from "./auth/hooks/useAuthRedirection";
import { channelsSection } from "./channels/urls";
import AppLayout from "./components/AppLayout";
import useAppChannel, { AppChannelProvider } from "./components/AppLayout/AppChannelContext";
import { DateProvider } from "./components/Date";
import { DevModeProvider } from "./components/DevModePanel/DevModeProvider";
import ErrorPage from "./components/ErrorPage";
import ExitFormDialogProvider from "./components/Form/ExitFormDialogProvider";
import { legacyRedirects } from "./components/LegacyRedirects";
import { LocaleProvider } from "./components/Locale";
import MessageManagerProvider from "./components/messages";
import { NavigatorSearchProvider } from "./components/NavigatorSearch/NavigatorSearchProvider";
import { ProductAnalytics } from "./components/ProductAnalytics";
import { SavebarRefProvider } from "./components/Savebar/SavebarRefContext";
import { ShopProvider } from "./components/Shop";
import { WindowTitle } from "./components/WindowTitle";
import { GTM_ID } from "./config";
import { getConfigMenuItemsPermissions } from "./configuration/utils";
import AppStateProvider from "./containers/AppState";
import BackgroundTasksProvider from "./containers/BackgroundTasks";
import { FeatureFlagsProviderWithUser } from "./featureFlags/FeatureFlagsProvider";
import { giftCardsSectionUrlName } from "./giftCards/urls";
import { reviewsSectionUrlName } from "./reviews/urls";
import { apolloClient, saleorClient } from "./graphql/client";
import { useLocationState } from "./hooks/useLocationState";
import { commonMessages } from "./intl";
import { NotFound } from "./NotFound";
import { errorTracker } from "./services/errorTracking";
import { paletteOverrides, themeOverrides } from "./themeOverrides";
import { warehouseSection } from "./warehouses/urls";


// Lazy-loaded page sections for code splitting
const AttributeSection = lazy(() => import("./attributes"));
const Auth = lazy(() => import("./auth"));
const CategorySection = lazy(() => import("./categories"));
const ChannelsSection = lazy(() => import("./channels"));
const CollectionSection = lazy(() => import("./collections"));
const CustomerSection = lazy(() =>
  import("./customers").then(m => ({ default: m.CustomerSection })),
);
const DiscountSection = lazy(() => import("./discounts"));
const ExtensionsSection = lazy(() =>
  import("./extensions").then(m => ({ default: m.ExtensionsSection })),
);
const GiftCardSection = lazy(() => import("./giftCards"));
const ReviewsSection = lazy(() => import("./reviews"));
const PageSection = lazy(() => import("./modeling"));
const PageTypesSection = lazy(() => import("./modelTypes"));
const OrdersSection = lazy(() => import("./orders"));
const PermissionGroupSection = lazy(() => import("./permissionGroups"));
const ProductSection = lazy(() => import("./products"));
const ProductTypesSection = lazy(() => import("./productTypes"));
const SearchSection = lazy(() => import("./search"));
const ShippingSection = lazy(() => import("./shipping"));
const SiteSettingsSection = lazy(() => import("./siteSettings"));
const StaffSection = lazy(() => import("./staff"));
const NavigationSection = lazy(() => import("./structures"));
const TaxesSection = lazy(() => import("./taxes"));
const TranslationsSection = lazy(() => import("./translations"));
const WarehouseSection = lazy(() => import("./warehouses"));
const ConfigurationSection = lazy(() => import("./configuration"));
const WelcomePage = lazy(() => import("./welcomePage").then(m => ({ default: m.WelcomePage })));
const RefundsSettingsRoute = lazy(() =>
  import("./refundsSettings/route").then(m => ({ default: m.RefundsSettingsRoute })),
);

if (GTM_ID) {
  TagManager.initialize({ gtmId: GTM_ID });
}

errorTracker.init();

/*
  Handle legacy theming toggle. Since we use new and old macaw,
  we need to handle both theme swticher for a while.
*/
const handleLegacyTheming = () => {
  const activeTheme = localStorage.getItem("activeMacawUITheme");

  if (activeTheme === "defaultDark") {
    localStorage.setItem("macaw-ui-theme", "dark");

    return;
  }

  localStorage.setItem("macaw-ui-theme", "light");
};

handleLegacyTheming();

/**
 * AppContent contains all providers and is rendered as the element
 * of the catch-all route in createBrowserRouter. This gives us
 * DataRouter context so useBlocker works for form exit protection.
 */
const AppContent = () => (
  // @ts-expect-error legacy types
  (<SaleorProvider client={saleorClient}>
    <ApolloProvider client={apolloClient}>
      {/* @ts-expect-error legacy types */}
      <LegacyThemeProvider overrides={themeOverrides} palettes={paletteOverrides}>
        <StyledEngineProvider injectFirst>
          <ThemeProvider>
            <DateProvider>
              <LocaleProvider>
                <MessageManagerProvider>
                  <BackgroundTasksProvider>
                    <AppStateProvider>
                      <AuthProvider>
                        <ProductAnalytics>
                          <ShopProvider>
                            <AppChannelProvider>
                              <ExitFormDialogProvider>
                                <DevModeProvider>
                                  <NavigatorSearchProvider>
                                    <SavebarRefProvider>
                                      <FeatureFlagsProviderWithUser>
                                        <OnboardingProvider>
                                          <AppRoutes />
                                        </OnboardingProvider>
                                      </FeatureFlagsProviderWithUser>
                                    </SavebarRefProvider>
                                  </NavigatorSearchProvider>
                                </DevModeProvider>
                              </ExitFormDialogProvider>
                            </AppChannelProvider>
                          </ShopProvider>
                        </ProductAnalytics>
                      </AuthProvider>
                    </AppStateProvider>
                  </BackgroundTasksProvider>
                </MessageManagerProvider>
              </LocaleProvider>
            </DateProvider>
          </ThemeProvider>
        </StyledEngineProvider>
      </LegacyThemeProvider>
    </ApolloProvider>
  </SaleorProvider>)
);

const AppRoutes = () => {
  const intl = useIntl();
  const [, dispatchAppState] = useAppState();
  const { authenticated, authenticating } = useAuthRedirection();
  const { channel } = useAppChannel(false);
  const channelLoaded = typeof channel !== "undefined";
  const homePageLoaded = channelLoaded && authenticated;
  const homePageLoading = (authenticated && !channelLoaded) || authenticating;
  const { isAppPath } = useLocationState();

  return (
    <>
      <WindowTitle title={intl.formatMessage(commonMessages.dashboard)} />
      {homePageLoaded ? (
        <AppExtensionPopupProvider>
          <AppLayout fullSize={isAppPath}>
            <ErrorBoundary
              onError={e => {
                const errorId = errorTracker.captureException(e);

                dispatchAppState({
                  payload: {
                    error: "unhandled",
                    errorId,
                  },
                  type: "displayError",
                });
              }}
              fallbackRender={({ resetErrorBoundary }) => (
                <ErrorPage onBack={resetErrorBoundary} onRefresh={() => window.location.reload()} />
              )}
            >
              <Suspense fallback={<LoginLoading />}>
                <RouterRoutes>
                  {legacyRedirects}
                  <Route path="/" element={<SectionGuard><WelcomePage /></SectionGuard>} />
                  <Route
                    path="/search"
                    element={
                      <SectionGuard
                        permissions={[
                          PermissionEnum.MANAGE_PRODUCTS,
                          PermissionEnum.MANAGE_ORDERS,
                          PermissionEnum.MANAGE_PAGES,
                          PermissionEnum.MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES,
                        ]}
                        matchPermission="any"
                      >
                        <SearchSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/categories/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_PRODUCTS]}>
                        <CategorySection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/collections/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_PRODUCTS]}>
                        <CollectionSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/customers/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_USERS]}>
                        <CustomerSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${giftCardsSectionUrlName}/*`}
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_GIFT_CARD]}>
                        <GiftCardSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${reviewsSectionUrlName}/*`}
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_PRODUCTS]}>
                        <ReviewsSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/discounts/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_DISCOUNTS]}>
                        <DiscountSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${pageListPath}/*`}
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_PAGES]}>
                        <PageSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${modelTypesPath}/*`}
                    element={
                      <SectionGuard
                        permissions={[
                          PermissionEnum.MANAGE_PAGES,
                          PermissionEnum.MANAGE_PAGE_TYPES_AND_ATTRIBUTES,
                        ]}
                        matchPermission="any"
                      >
                        <PageTypesSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/orders/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_ORDERS]}>
                        <OrdersSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/products/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_PRODUCTS]}>
                        <ProductSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/product-types/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES]}>
                        <ProductTypesSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/staff/*"
                    element={<SectionGuard><StaffSection /></SectionGuard>}
                  />
                  <Route
                    path="/permission-groups/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_STAFF]}>
                        <PermissionGroupSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/site-settings/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_SETTINGS]}>
                        <SiteSettingsSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${refundsSettingsPath}/*`}
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_SETTINGS]}>
                        <RefundsSettingsRoute />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/taxes/*"
                    element={<SectionGuard><TaxesSection /></SectionGuard>}
                  />
                  <Route
                    path="/shipping/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_SHIPPING]}>
                        <ShippingSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/translations/*"
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_TRANSLATIONS]}>
                        <TranslationsSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${structuresListPath}/*`}
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_MENUS]}>
                        <NavigationSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${attributeSection}/*`}
                    element={
                      <SectionGuard
                        permissions={[
                          PermissionEnum.MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES,
                          PermissionEnum.MANAGE_PAGE_TYPES_AND_ATTRIBUTES,
                        ]}
                        matchPermission="any"
                      >
                        <AttributeSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${extensionsSection}/*`}
                    element={
                      <SectionGuard permissions={[]}>
                        <ExtensionsSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${warehouseSection}/*`}
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_PRODUCTS]}>
                        <WarehouseSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path={`${channelsSection}/*`}
                    element={
                      <SectionGuard permissions={[PermissionEnum.MANAGE_CHANNELS]}>
                        <ChannelsSection />
                      </SectionGuard>
                    }
                  />
                  <Route
                    path="/configuration"
                    element={
                      <SectionGuard
                        matchPermission="any"
                        permissions={getConfigMenuItemsPermissions(intl)}
                      >
                        <ConfigurationSection />
                      </SectionGuard>
                    }
                  />
                  <Route path="/apps" element={<Navigate to={ExtensionsPaths.installedExtensions} replace />} />
                  <Route path="/custom-apps/*" element={<Navigate to={ExtensionsPaths.installedExtensions} replace />} />
                  <Route path="/plugins" element={<Navigate to={ExtensionsPaths.installedExtensions} replace />} />
                  <Route path="*" element={<NotFound />} />
                </RouterRoutes>
              </Suspense>
            </ErrorBoundary>
          </AppLayout>
        </AppExtensionPopupProvider>
      ) : homePageLoading ? (
        <LoginLoading />
      ) : (
        <Suspense fallback={<LoginLoading />}>
          <Auth />
        </Suspense>
      )}
    </>
  );
};

// Create the router using createBrowserRouter (data router).
// This provides DataRouter context so useBlocker works for form exit protection.
const router = createAppRouter(<AppContent />);

const root = createRoot(document.querySelector("#dashboard-app")!);

// StrictMode double-mounts in dev and can break EditorJS/Combobox. Disable with VITE_DISABLE_STRICT_MODE=true.
// Production builds already run without StrictMode (import.meta.env.DEV is false). Set the env at build time
// (e.g. in .env or Docker build-args) so the flag is baked into the bundle.
const disableStrictMode = import.meta.env.VITE_DISABLE_STRICT_MODE === "true";
const enableStrictMode = import.meta.env.DEV && !disableStrictMode;

root.render(
  enableStrictMode ? (
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  ) : (
    <RouterProvider router={router} />
  ),
);
