/**
 * Deactivate Products Script
 *
 * Cross-references the original product_export.xlsx with Saleor to unpublish
 * products that were originally inactive (status !== "1").
 *
 * Usage:
 *   npm run deactivate          # Execute unpublishing
 *   npm run deactivate:dry      # Preview without changes
 */
import "dotenv/config";
import ExcelJS from "exceljs";
import { GraphQLClient, gql } from "graphql-request";
import path from "path";

const SALEOR_URL = process.env.SALEOR_URL!;
const SALEOR_TOKEN = process.env.SALEOR_TOKEN!;

if (!SALEOR_URL || !SALEOR_TOKEN) {
  console.error("Missing SALEOR_URL or SALEOR_TOKEN in .env");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const client = new GraphQLClient(SALEOR_URL, {
  headers: { Authorization: `Bearer ${SALEOR_TOKEN}` },
});

// Same slugify as import-converter.ts
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s*>\s*/g, "-")
    .replace(/[׳']/g, "")
    .replace(/[^\u0590-\u05FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Column indices matching import-converter.ts
const COL = { STATUS: 1, NAME: 2, SLUG: 7 } as const;

// ── GraphQL ──────────────────────────────────────────────────────────────────

const PRODUCTS_QUERY = gql`
  query AllProducts($after: String) {
    products(first: 100, after: $after) {
      edges {
        node {
          id
          slug
          name
          channelListings {
            channel { id slug }
            isPublished
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const CHANNEL_LISTING_UPDATE = gql`
  mutation ProductChannelListingUpdate($id: ID!, $input: ProductChannelListingUpdateInput!) {
    productChannelListingUpdate(id: $id, input: $input) {
      product { id }
      errors { field message }
    }
  }
`;

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Deactivate Inactive Products ===\n");
  console.log(`API: ${SALEOR_URL}`);
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "EXECUTE"}\n`);

  // 1. Read Excel and build slug → active/inactive map
  const excelPath = path.resolve(__dirname, "../output/product_export.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(excelPath);
  const sheet = wb.worksheets[0];

  const inactiveSlugs = new Set<string>();
  const activeSlugs = new Set<string>();
  let totalProducts = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const cellStr = (idx: number) => String(row.getCell(idx + 1).value || "").trim();

    const status = cellStr(COL.STATUS);
    const name = cellStr(COL.NAME);
    const rawSlug = cellStr(COL.SLUG);
    if (!name) return;

    totalProducts++;
    const slug = rawSlug || slugify(name);

    if (status === "1") {
      activeSlugs.add(slug.toLowerCase());
    } else {
      inactiveSlugs.add(slug.toLowerCase());
    }
  });

  console.log(`Read ${totalProducts} products from Excel`);
  console.log(`  Active: ${activeSlugs.size}, Inactive: ${inactiveSlugs.size}\n`);

  // 2. Fetch all products from Saleor
  interface SaleorProduct {
    id: string;
    slug: string;
    name: string;
    channelListings: { channel: { id: string; slug: string }; isPublished: boolean }[];
  }

  const saleorProducts: SaleorProduct[] = [];
  let after: string | null = null;

  console.log("Fetching products from Saleor...");
  while (true) {
    const data: any = await client.request(PRODUCTS_QUERY, { after });
    for (const edge of data.products.edges) {
      saleorProducts.push(edge.node);
    }
    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
  }
  console.log(`  Found ${saleorProducts.length} products in Saleor\n`);

  // 3. Cross-reference and unpublish
  let unpublished = 0;
  let alreadyInactive = 0;
  let keptActive = 0;
  let notInExcel = 0;

  for (const product of saleorProducts) {
    const slugLower = product.slug.toLowerCase();
    const publishedChannels = product.channelListings.filter((cl) => cl.isPublished);

    if (inactiveSlugs.has(slugLower)) {
      if (publishedChannels.length > 0) {
        // Needs to be unpublished
        if (DRY_RUN) {
          console.log(`  Would unpublish: "${product.name}" (${product.slug})`);
        } else {
          try {
            const result: any = await client.request(CHANNEL_LISTING_UPDATE, {
              id: product.id,
              input: {
                updateChannels: publishedChannels.map((cl) => ({
                  channelId: cl.channel.id,
                  isPublished: false,
                })),
              },
            });
            if (result.productChannelListingUpdate.errors?.length > 0) {
              console.error(`  Error unpublishing "${product.name}":`, result.productChannelListingUpdate.errors);
              continue;
            }
          } catch (err: any) {
            console.error(`  Error unpublishing "${product.name}":`, err.message?.substring(0, 100));
            continue;
          }
        }
        unpublished++;
      } else {
        alreadyInactive++;
      }
    } else if (activeSlugs.has(slugLower)) {
      keptActive++;
    } else {
      notInExcel++;
    }
  }

  console.log("\n=== Summary ===");
  console.log(`  ${DRY_RUN ? "Would unpublish" : "Unpublished"}: ${unpublished}`);
  console.log(`  Already inactive: ${alreadyInactive}`);
  console.log(`  Kept active: ${keptActive}`);
  console.log(`  Not in Excel (skipped): ${notInExcel}`);

  if (DRY_RUN) {
    console.log("\nThis was a dry run. Run without --dry-run to execute.");
  } else {
    console.log("\nDone! Inactive products have been unpublished.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
