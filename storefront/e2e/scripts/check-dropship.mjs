const API_URL = "http://localhost:8000/graphql/";

async function run() {
  const query = `query {
    products(channel: "usd", first: 5, filter: { isPublished: true, metadata: [{ key: "dropship.supplier" }] }) {
      edges {
        node {
          id name slug
          metadata { key value }
          variants {
            id name quantityAvailable
            pricing(address: {}) {
              price { gross { amount currency } }
            }
          }
        }
      }
    }
  }`;

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  const products = json.data.products.edges;
  for (const { node } of products) {
    console.log("\n=== " + node.name + " (" + node.slug + ") ===");
    const dropshipMeta = node.metadata.filter(m => m.key.startsWith("dropship"));
    console.log("Metadata:", dropshipMeta.map(m => m.key + "=" + m.value).join(", "));
    for (const v of (node.variants || [])) {
      const p = v.pricing?.price?.gross;
      console.log("  Variant:", v.name, "| qty:", v.quantityAvailable, "| price:", p?.amount, p?.currency);
    }
  }
}

run().catch(console.error);
