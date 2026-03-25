import json, urllib.request, sys, os

EMAIL = os.environ.get('AURA_ADMIN_EMAIL', 'admin@example.com')
PASSWORD = os.environ.get('AURA_ADMIN_PASSWORD', '')
if not PASSWORD:
    print("ERROR: Set AURA_ADMIN_PASSWORD environment variable (see infra/.env.self-hosted)")
    sys.exit(1)
SALE_COLLECTION = 'Q29sbGVjdGlvbjozOA=='

def gql(q, token=None, variables=None):
    payload = {'query': q}
    if variables:
        payload['variables'] = variables
    h = {'Content-Type': 'application/json'}
    if token:
        h['Authorization'] = 'Bearer ' + token
    r = urllib.request.Request('http://localhost:8000/graphql/', data=json.dumps(payload).encode(), headers=h)
    d = json.loads(urllib.request.urlopen(r).read())
    if d.get('errors'):
        print(f"  ERR: {d['errors'][0]['message'][:80]}")
    return d

# Auth
token = gql('mutation{tokenCreate(email:"' + EMAIL + '",password:"' + PASSWORD + '"){token}}')['data']['tokenCreate']['token']
print(f"Authenticated OK")

# Sale product slugs (partial match)
sale_slugs = [
    "pets-dog-cat-baby-safety-gate",
    "creative-cat-pet-led-laser",
    "automatic-explore-retractable-dog-leash",
    "pet-water-dispenser-intelligent",
    "ihrtrade-tactical-dog-harness",
    "dog-double-bowls-stainless",
    "dog-ramp",
    "pet-pumpkin-brush",
    "dadypet-pet-dog-hair-dryer",
    "pet-dog-carrier-bag",
    "automatic-drinking-fountain-cat",
    "calming-cat-beds-for-indoor",
    "plush-round-pet-bed",
    "pet-dog-bed",
    "cat-hanging-bed-hanging",
    "dog-life-vest-summer-shark",
    "anxiety-jacket-vest-summer",
    "pet-clothes-dog-anxiety-jacket",
    "pet-dog-sofa-bed",
    "cat-window-chuck-hammock",
    "window-sill-cat-hammock",
    "dog-thick-snow-boots",
    "cat-catnip-teething-stick",
    "pet-dog-toys-carrot-plush",
    "2-in-1-self-cleaning-dog-brush",
    "pet-hair-remover-mitt",
    "cat-self-grooming-brush",
    "pet-ice-mat-summer",
    "stainless-double-sided-pet-brush",
    "pet-dog-water-bottle-feeder-bowl",
    "pet-toy-donkey-shape",
    "fluffy-donut-dog-bed",
    "double-layer-litter-cat-bed",
    "summer-cooling-pet-sleeping",
    "silicone-dog-bath-massage",
    "cat-litter-mat-pet-solid",
    "semi-enclosed-pet-bed",
]

# Fetch all product IDs
all_ids = {}
def fetch_page(after=None):
    cursor = ', after: "' + after + '"' if after else ''
    return gql('{products(channel:"usd",first:100' + cursor + '){edges{node{id slug}}pageInfo{hasNextPage endCursor}}}')

d = fetch_page()
for e in d['data']['products']['edges']:
    all_ids[e['node']['slug']] = e['node']['id']
pi = d['data']['products']['pageInfo']
if pi['hasNextPage']:
    d2 = fetch_page(pi['endCursor'])
    for e in d2['data']['products']['edges']:
        all_ids[e['node']['slug']] = e['node']['id']

print(f"Total products in DB: {len(all_ids)}")

# Match slugs
matched = []
for target in sale_slugs:
    for slug, pid in all_ids.items():
        if slug.startswith(target):
            matched.append((slug, pid))
            break

print(f"Matched {len(matched)} products for sale collection")

# Add to sale collection
batch = [m[1] for m in matched]
for i in range(0, len(batch), 20):
    chunk = batch[i:i+20]
    result = gql(
        'mutation($id: ID!, $products: [ID!]!) { collectionAddProducts(collectionId: $id, products: $products) { errors { field message } } }',
        token=token,
        variables={'id': SALE_COLLECTION, 'products': chunk}
    )
    errs = (result.get('data') or {}).get('collectionAddProducts', {}).get('errors', [])
    if errs:
        print(f"  Batch {i//20+1} FAIL: {errs[0]['message']}")
    else:
        print(f"  Batch {i//20+1}: Added {len(chunk)} products to Sale collection")

print("\nDone!")
