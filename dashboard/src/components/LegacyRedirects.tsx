import { modelingSection } from "@dashboard/modeling/urls";
import { modelTypesPath } from "@dashboard/modelTypes/urls";
import { structuresListPath } from "@dashboard/structures/urls";
import { Navigate, Route, useLocation, useParams } from "react-router";
import urlJoin from "url-join";

/**
 * Helper component that reads the splat param and current search,
 * then navigates to the new path.
 */
function LegacyRedirect({ basePath }: { basePath: string }) {
  const { "*": rest } = useParams();
  const { search } = useLocation();
  const target = urlJoin(basePath, rest || "") + search;

  return <Navigate to={target} replace />;
}

/**
 * Legacy redirect routes. In v6, regex patterns like `:rest(.*)` are replaced
 * by the splat `*` at the end of the path.
 */
export const legacyRedirects = [
  // Redirect old /pages/* to /models/*
  <Route
    key="pages-redirect"
    path="/pages/*"
    element={<LegacyRedirect basePath={modelingSection} />}
  />,
  // Redirect old /page-types/* to /model-types/*
  <Route
    key="page-types-redirect"
    path="/page-types/*"
    element={<LegacyRedirect basePath={modelTypesPath} />}
  />,
  // Redirect old /navigation/* to /structures/*
  <Route
    key="navigation-redirect"
    path="/navigation/*"
    element={<LegacyRedirect basePath={structuresListPath} />}
  />,
];
