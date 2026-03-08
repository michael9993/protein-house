/**
 * Cleanup script: Deletes all products, collections, and categories from Saleor.
 * Run BEFORE uploading new catalog data.
 *
 * Usage: npm run cleanup
 *   or:  npm run cleanup -- --dry-run   (just count, don't delete)
 */
import "dotenv/config";
import { GraphQLClient, gql } from "graphql-request";

const SALEOR_URL = process.env.SALEOR_URL!;
const SALEOR_TOKEN = process.env.SALEOR_TOKEN!;

if (!SALEOR_URL || !SALEOR_TOKEN) {
  console.error("Missing SALEOR_URL or SALEOR_TOKEN in .env");
  process.exit(1);
}

const client = new GraphQLClient(SALEOR_URL, {
  headers: { Authorization: `Bearer ${SALEOR_TOKEN}` },
});

const DRY_RUN = process.argv.includes("--dry-run");

// ── GraphQL Queries ────────────────────────────────────────────────────────

const PRODUCTS_QUERY = gql`
  query AllProducts($after: String) {
    products(first: 100, after: $after) {
      edges {
        node {
          id
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

const COLLECTIONS_QUERY = gql`
  query AllCollections($after: String) {
    collections(first: 100, after: $after) {
      edges {
        node {
          id
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

// Fetch only root categories (level: 0) — deleting a root deletes all its children
const CATEGORIES_QUERY = gql`
  query RootCategories($after: String) {
    categories(first: 100, after: $after, level: 0) {
      edges {
        node {
          id
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

const PRODUCT_BULK_DELETE = gql`
  mutation ProductBulkDelete($ids: [ID!]!) {
    productBulkDelete(ids: $ids) {
      count
      errors {
        field
        message
      }
    }
  }
`;

const COLLECTION_DELETE = gql`
  mutation CollectionDelete($id: ID!) {
    collectionDelete(id: $id) {
      errors {
        field
        message
      }
    }
  }
`;

const CATEGORY_DELETE = gql`
  mutation CategoryDelete($id: ID!) {
    categoryDelete(id: $id) {
      errors {
        field
        message
      }
    }
  }
`;

// ── Helpers ────────────────────────────────────────────────────────────────

async function fetchAllIds(
  query: string,
  rootField: string,
): Promise<{ id: string; name: string }[]> {
  const items: { id: string; name: string }[] = [];
  let after: string | null = null;

  while (true) {
    const data: any = await client.request(query, { after });
    const connection = data[rootField];
    for (const edge of connection.edges) {
      items.push({ id: edge.node.id, name: edge.node.name });
    }
    if (!connection.pageInfo.hasNextPage) break;
    after = connection.pageInfo.endCursor;
  }

  return items;
}

// Fetch root categories only — Saleor cascades deletion to children
async function fetchRootCategories(): Promise<{ id: string; name: string }[]> {
  return fetchAllIds(CATEGORIES_QUERY, "categories");
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Saleor Catalog Cleanup ===\n");
  console.log(`API: ${SALEOR_URL}`);
  if (DRY_RUN) console.log("MODE: DRY RUN (no deletions)\n");
  else console.log("MODE: DELETE ALL\n");

  // 1. Delete products first (they reference categories/collections)
  console.log("Fetching all products...");
  const products = await fetchAllIds(PRODUCTS_QUERY, "products");
  console.log(`  Found ${products.length} products`);

  if (!DRY_RUN && products.length > 0) {
    // Delete in batches of 100
    for (let i = 0; i < products.length; i += 100) {
      const batch = products.slice(i, i + 100);
      const ids = batch.map((p) => p.id);
      const result: any = await client.request(PRODUCT_BULK_DELETE, { ids });
      const count = result.productBulkDelete.count;
      const errors = result.productBulkDelete.errors;
      if (errors.length > 0) {
        console.error(`  Error deleting products batch ${i / 100 + 1}:`, errors);
      } else {
        console.log(`  Deleted batch ${i / 100 + 1}: ${count} products`);
      }
    }
    console.log(`  All ${products.length} products deleted.\n`);
  } else {
    console.log();
  }

  // 2. Delete collections
  console.log("Fetching all collections...");
  const collections = await fetchAllIds(COLLECTIONS_QUERY, "collections");
  console.log(`  Found ${collections.length} collections`);

  if (!DRY_RUN && collections.length > 0) {
    for (const col of collections) {
      const result: any = await client.request(COLLECTION_DELETE, { id: col.id });
      if (result.collectionDelete.errors.length > 0) {
        console.error(`  Error deleting collection "${col.name}":`, result.collectionDelete.errors);
      }
    }
    console.log(`  All ${collections.length} collections deleted.\n`);
  } else {
    console.log();
  }

  // 3. Delete categories (delete from deepest to shallowest — reverse order)
  // 3. Delete root categories (Saleor cascades to all children automatically)
  console.log("Fetching root categories...");
  const categories = await fetchRootCategories();
  console.log(`  Found ${categories.length} root categories (children deleted automatically)`);

  if (!DRY_RUN && categories.length > 0) {
    let deleted = 0;
    for (const cat of categories) {
      try {
        const result: any = await client.request(CATEGORY_DELETE, { id: cat.id });
        if (result.categoryDelete.errors.length > 0) {
          console.error(`  Error deleting category "${cat.name}":`, result.categoryDelete.errors);
        } else {
          deleted++;
        }
      } catch (err: any) {
        console.error(`  Error deleting "${cat.name}":`, err.message?.substring(0, 100));
      }
    }
    console.log(`  Deleted ${deleted} root categories (+ all children).\n`);
  } else {
    console.log();
  }

  console.log("=== Cleanup Complete ===");
  if (DRY_RUN) {
    console.log("\nThis was a dry run. Run without --dry-run to actually delete.");
  } else {
    console.log("\nDashboard is clean. Now upload Pawzen data:");
    console.log("  1. npm run deploy:ci    (apply config.yml attribute updates)");
    console.log("  2. Upload categories:   Bulk Manager > Categories > output/categories.csv");
    console.log("  3. Upload collections:  Bulk Manager > Collections > output/collections.csv");
    console.log("  4. Upload products:     Bulk Manager > Products > output/pawzen-catalog.xlsx");
    console.log("  5. npm run translate    (add Hebrew translations)");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
