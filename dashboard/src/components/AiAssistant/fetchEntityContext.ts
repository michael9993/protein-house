import { gql } from "@apollo/client";
import { apolloClient } from "@dashboard/graphql/client";

const ORDER_CONTEXT_QUERY = gql`
  query AiOrderContext($id: ID!) {
    order(id: $id) {
      number
      status
      paymentStatus
      total {
        gross {
          amount
          currency
        }
      }
      user {
        firstName
        lastName
        email
      }
      lines {
        id
      }
      created
    }
  }
`;

const PRODUCT_CONTEXT_QUERY = gql`
  query AiProductContext($id: ID!) {
    product(id: $id) {
      name
      slug
      productType {
        name
      }
      variants {
        id
      }
      channelListings {
        channel {
          name
        }
        isPublished
      }
      created
    }
  }
`;

const CUSTOMER_CONTEXT_QUERY = gql`
  query AiCustomerContext($id: ID!) {
    user(id: $id) {
      email
      firstName
      lastName
      orders {
        totalCount
      }
      dateJoined
      note
    }
  }
`;

// Cache entity context per session to avoid re-fetching on every message
const entityCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): string | null {
  const entry = entityCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  entityCache.delete(key);
  return null;
}

function setCache(key: string, data: string) {
  entityCache.set(key, { data, timestamp: Date.now() });
}

async function fetchOrderContext(id: string): Promise<string | null> {
  try {
    const { data } = await apolloClient.query({
      query: ORDER_CONTEXT_QUERY,
      variables: { id },
      fetchPolicy: "cache-first",
    });
    const o = data?.order;
    if (!o) return null;
    const customer = o.user
      ? `${o.user.firstName} ${o.user.lastName} (${o.user.email})`
      : "Guest";
    return `Order #${o.number}: status=${o.status}, payment=${o.paymentStatus}, total=${o.total.gross.amount} ${o.total.gross.currency}, customer=${customer}, items=${o.lines.length}`;
  } catch {
    return null;
  }
}

async function fetchProductContext(id: string): Promise<string | null> {
  try {
    const { data } = await apolloClient.query({
      query: PRODUCT_CONTEXT_QUERY,
      variables: { id },
      fetchPolicy: "cache-first",
    });
    const p = data?.product;
    if (!p) return null;
    const channels = p.channelListings
      ?.map(
        (cl: { channel: { name: string }; isPublished: boolean }) =>
          `${cl.channel.name}(${cl.isPublished ? "published" : "draft"})`,
      )
      .join(", ");
    return `Product "${p.name}": type=${p.productType.name}, variants=${p.variants?.length ?? 0}, channels=[${channels}]`;
  } catch {
    return null;
  }
}

async function fetchCustomerContext(id: string): Promise<string | null> {
  try {
    const { data } = await apolloClient.query({
      query: CUSTOMER_CONTEXT_QUERY,
      variables: { id },
      fetchPolicy: "cache-first",
    });
    const c = data?.user;
    if (!c) return null;
    return `Customer: ${c.firstName} ${c.lastName} (${c.email}), orders=${c.orders?.totalCount ?? 0}${c.note ? `, note="${c.note}"` : ""}`;
  } catch {
    return null;
  }
}

function extractEntityInfo(
  pathname: string,
): { type: "order" | "product" | "customer"; id: string } | null {
  const orderMatch = pathname.match(/^\/orders\/([^/]+)$/);
  if (orderMatch && orderMatch[1] !== "drafts") {
    return { type: "order", id: orderMatch[1] };
  }

  const productMatch = pathname.match(/^\/products\/([^/]+)$/);
  if (productMatch && productMatch[1] !== "add") {
    return { type: "product", id: productMatch[1] };
  }

  const customerMatch = pathname.match(/^\/customers\/([^/]+)$/);
  if (customerMatch) {
    return { type: "customer", id: customerMatch[1] };
  }

  return null;
}

export async function fetchEntityContext(
  pathname: string,
): Promise<string | null> {
  const entity = extractEntityInfo(pathname);
  if (!entity) return null;

  const cacheKey = `${entity.type}:${entity.id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let result: string | null = null;

  switch (entity.type) {
    case "order":
      result = await fetchOrderContext(entity.id);
      break;
    case "product":
      result = await fetchProductContext(entity.id);
      break;
    case "customer":
      result = await fetchCustomerContext(entity.id);
      break;
  }

  if (result) {
    setCache(cacheKey, result);
  }

  return result;
}
