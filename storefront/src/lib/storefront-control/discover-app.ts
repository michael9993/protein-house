import { executeGraphQL } from "@/lib/graphql";
import { gql } from "graphql-tag";

const STOREFRONT_CONTROL_APP_ID = "saleor.app.storefront-control";

const AppsQuery = gql`
  query AppsQuery {
    apps(first: 100, filter: { isActive: true }) {
      edges {
        node {
          id
          identifier
          appUrl
        }
      }
    }
  }
`;

interface App {
  id: string;
  identifier: string;
  appUrl: string;
}

interface AppsQueryResult {
  apps: {
    edges: Array<{
      node: App;
    }>;
  } | null;
}

/**
 * Discover the Storefront Control app URL from Saleor.
 * This queries Saleor for installed apps and finds the storefront-control app.
 * 
 * Returns null if:
 * - App is not installed
 * - App is not active
 * - Query fails
 */
export async function discoverControlAppUrl(): Promise<string | null> {
  try {
    const result = await executeGraphQL<AppsQueryResult, object>(AppsQuery as any, {
      variables: {},
      revalidate: 3600, // Cache for 1 hour
    });

    if (!result.apps?.edges) {
      return null;
    }

    const controlApp = result.apps.edges.find(
      (edge) => edge.node.identifier === STOREFRONT_CONTROL_APP_ID
    );

    return controlApp?.node.appUrl ?? null;
  } catch (error) {
    console.error("[discoverControlAppUrl] Error discovering app:", error);
    return null;
  }
}

/**
 * Get the control app URL from environment variable or discover from Saleor.
 * Environment variable takes precedence for faster loading.
 */
export async function getControlAppUrl(): Promise<string | null> {
  // Check environment variable first (faster)
  const envUrl = process.env.STOREFRONT_CONTROL_APP_URL;
  if (envUrl) {
    return envUrl;
  }

  // Fall back to discovery
  return discoverControlAppUrl();
}
