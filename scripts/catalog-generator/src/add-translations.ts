import "dotenv/config";
import { GraphQLClient, gql } from "graphql-request";
import { CATEGORIES } from "./config/categories";
import { COLLECTIONS } from "./config/collections";

const SALEOR_URL = process.env.SALEOR_URL!;
const SALEOR_TOKEN = process.env.SALEOR_TOKEN!;

if (!SALEOR_URL || !SALEOR_TOKEN) {
  console.error("Missing SALEOR_URL or SALEOR_TOKEN in .env");
  process.exit(1);
}

const client = new GraphQLClient(SALEOR_URL, {
  headers: { Authorization: `Bearer ${SALEOR_TOKEN}` },
});

// --- GraphQL Queries & Mutations ---

const FETCH_CATEGORIES = gql`
  query FetchCategories($first: Int!, $after: String) {
    categories(first: $first, after: $after) {
      edges {
        node {
          id
          slug
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const FETCH_COLLECTIONS = gql`
  query FetchCollections($first: Int!, $after: String) {
    collections(first: $first, after: $after) {
      edges {
        node {
          id
          slug
          name
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const TRANSLATE_CATEGORY = gql`
  mutation TranslateCategory($id: ID!, $languageCode: LanguageCodeEnum!, $input: TranslationInput!) {
    categoryTranslate(id: $id, languageCode: $languageCode, input: $input) {
      category {
        id
        name
        translation(languageCode: $languageCode) {
          name
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

const TRANSLATE_COLLECTION = gql`
  mutation TranslateCollection($id: ID!, $languageCode: LanguageCodeEnum!, $input: TranslationInput!) {
    collectionTranslate(id: $id, languageCode: $languageCode, input: $input) {
      collection {
        id
        name
        translation(languageCode: $languageCode) {
          name
        }
      }
      errors {
        field
        message
      }
    }
  }
`;

// --- Helpers ---

interface SaleorNode {
  id: string;
  slug: string;
  name: string;
}

interface PageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

async function fetchAllPages<T extends SaleorNode>(
  query: string,
  rootKey: "categories" | "collections"
): Promise<T[]> {
  const all: T[] = [];
  let after: string | null = null;
  let hasNext = true;

  while (hasNext) {
    const data: any = await client.request(query, { first: 100, after });
    const connection = data[rootKey];
    const nodes = connection.edges.map((e: { node: T }) => e.node);
    all.push(...nodes);
    const pageInfo: PageInfo = connection.pageInfo;
    hasNext = pageInfo.hasNextPage;
    after = pageInfo.endCursor;
  }

  return all;
}

// --- Main ---

async function addTranslations() {
  console.log("Fetching categories and collections from Saleor...\n");

  const [saleorCategories, saleorCollections] = await Promise.all([
    fetchAllPages<SaleorNode>(FETCH_CATEGORIES, "categories"),
    fetchAllPages<SaleorNode>(FETCH_COLLECTIONS, "collections"),
  ]);

  console.log(`Found ${saleorCategories.length} categories, ${saleorCollections.length} collections\n`);

  // Build slug → ID maps
  const catBySlug = new Map(saleorCategories.map((c) => [c.slug, c]));
  const colBySlug = new Map(saleorCollections.map((c) => [c.slug, c]));

  // Translate categories
  let catSuccess = 0;
  let catSkipped = 0;

  console.log("--- Categories ---");
  for (const cat of CATEGORIES) {
    const saleorCat = catBySlug.get(cat.slug);
    if (!saleorCat) {
      console.log(`  SKIP: "${cat.name_en}" (slug: ${cat.slug}) — not found in Saleor`);
      catSkipped++;
      continue;
    }

    try {
      await client.request(TRANSLATE_CATEGORY, {
        id: saleorCat.id,
        languageCode: "HE",
        input: {
          name: cat.name_he,
          ...(cat.description_he ? { description: JSON.stringify({ blocks: [{ type: "paragraph", data: { text: cat.description_he } }] }) } : {}),
        },
      });
      console.log(`  OK: "${cat.name_en}" → "${cat.name_he}"`);
      catSuccess++;
    } catch (err: any) {
      console.error(`  FAIL: "${cat.name_en}" — ${err.message}`);
    }
  }

  console.log(`\nCategories: ${catSuccess} translated, ${catSkipped} skipped\n`);

  // Translate collections
  let colSuccess = 0;
  let colSkipped = 0;

  console.log("--- Collections ---");
  for (const col of COLLECTIONS) {
    const saleorCol = colBySlug.get(col.slug);
    if (!saleorCol) {
      console.log(`  SKIP: "${col.name_en}" (slug: ${col.slug}) — not found in Saleor`);
      colSkipped++;
      continue;
    }

    try {
      await client.request(TRANSLATE_COLLECTION, {
        id: saleorCol.id,
        languageCode: "HE",
        input: {
          name: col.name_he,
          ...(col.description_he ? { description: JSON.stringify({ blocks: [{ type: "paragraph", data: { text: col.description_he } }] }) } : {}),
        },
      });
      console.log(`  OK: "${col.name_en}" → "${col.name_he}"`);
      colSuccess++;
    } catch (err: any) {
      console.error(`  FAIL: "${col.name_en}" — ${err.message}`);
    }
  }

  console.log(`\nCollections: ${colSuccess} translated, ${colSkipped} skipped`);
  console.log(`\nDone! Total: ${catSuccess + colSuccess} translations applied.`);
}

addTranslations().catch((error) => {
  console.error("Error adding translations:", error);
  process.exit(1);
});
