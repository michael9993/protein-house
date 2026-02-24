const API = "http://localhost:8000/graphql/";
async function gql(q, v) {
  const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q, variables: v }) });
  return r.json();
}
async function run() {
  const p = await gql(`{products(channel:"ils",first:1,filter:{isPublished:true,metadata:[{key:"dropship.supplier"}]}){edges{node{name variants{id quantityAvailable pricing{price{gross{amount currency}}}}}}}}`);
  const prod = p.data?.products?.edges?.[0]?.node;
  if (!prod) { console.log("No dropship product"); return; }
  const v = prod.variants.find(x => x.quantityAvailable == null || x.quantityAvailable > 0) || prod.variants[0];
  const price = v.pricing?.price?.gross?.amount || 60;
  const qty = Math.ceil(300 / price) + 1;
  console.log(`Product: ${prod.name} | Price: ${price} | Qty: ${qty}`);

  const co = await gql(`mutation($i:CheckoutCreateInput!){checkoutCreate(input:$i){checkout{id token}errors{field message}}}`, { i: { channel: "ils", lines: [{ variantId: v.id, quantity: qty }], email: "test@test.com" } });
  const checkout = co.data?.checkoutCreate?.checkout;
  if (!checkout) { console.log("Failed:", JSON.stringify(co.data?.checkoutCreate?.errors)); return; }
  console.log("Checkout:", checkout.id);

  await gql(`mutation($id:ID!,$a:AddressInput!){checkoutShippingAddressUpdate(id:$id,shippingAddress:$a){checkout{id}errors{field message}}}`, { id: checkout.id, a: { firstName: "Test", lastName: "User", streetAddress1: "123 Herzl St", city: "Tel Aviv", postalCode: "6100000", country: "IL" } });
  console.log("Address set");
  console.log(`URL: http://localhost:3000/ils/checkout?checkout=${checkout.id}`);
}
run().catch(console.error);
