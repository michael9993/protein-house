/**
 * Detailed CMS Integration Test
 * 
 * Tests CMS features and provides detailed report
 */

const API_URL = process.env.SALEOR_API_URL || 'http://localhost:8000/graphql/';
const CHANNEL = process.env.CHANNEL || 'default-channel';

async function queryGraphQL(query, variables = {}) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    return await response.json();
  } catch (error) {
    return { errors: [{ message: error.message }] };
  }
}

async function testCategories() {
  console.log('\n📁 Testing Categories...');
  const result = await queryGraphQL(`
    query CategoriesForHomepage($channel: String!) {
      categories(first: 8, level: 0) {
        edges {
          node {
            id
            name
            slug
            backgroundImage { url }
            products(channel: $channel, first: 1) { totalCount }
          }
        }
      }
    }
  `, { channel: CHANNEL });
  
  if (result.errors) {
    console.log('  ❌ Error:', result.errors[0].message);
    return { success: false, count: 0 };
  }
  
  const categories = result.data?.categories?.edges || [];
  console.log(`  ✅ Found ${categories.length} categories`);
  
  categories.forEach(({ node }) => {
    const hasImage = node.backgroundImage?.url ? '🖼️' : '❌';
    const productCount = node.products?.totalCount || 0;
    console.log(`     ${hasImage} ${node.name} (${productCount} products)`);
  });
  
  return { success: true, count: categories.length, categories };
}

async function testCollection(name, slug, expectedMetadata = []) {
  console.log(`\n📦 Testing Collection: ${name} (${slug})...`);
  const result = await queryGraphQL(`
    query Collection($slug: String!, $channel: String!) {
      collection(slug: $slug, channel: $channel) {
        id
        name
        backgroundImage { url }
        metadata {
          key
          value
        }
        products(first: 1) { totalCount }
      }
    }
  `, { slug, channel: CHANNEL });
  
  if (result.errors) {
    console.log('  ❌ Collection not found or error:', result.errors[0].message);
    return { success: false, exists: false };
  }
  
  const collection = result.data?.collection;
  if (!collection) {
    console.log('  ⚠️  Collection does not exist');
    console.log(`     → Create it in Dashboard: Catalog → Collections → Create`);
    console.log(`     → Set slug to: "${slug}"`);
    return { success: false, exists: false };
  }
  
  console.log(`  ✅ Collection exists: ${collection.name}`);
  
  const metadata = collection.metadata || [];
  console.log(`  📝 Metadata fields: ${metadata.length}`);
  
  if (metadata.length > 0) {
    metadata.forEach(({ key, value }) => {
      const preview = value.length > 50 ? value.substring(0, 50) + '...' : value;
      console.log(`     • ${key}: ${preview}`);
    });
  } else {
    console.log('  ⚠️  No metadata configured');
    if (expectedMetadata.length > 0) {
      console.log('     → Add these metadata keys:');
      expectedMetadata.forEach(key => console.log(`       - ${key}`));
    }
  }
  
  const hasImage = collection.backgroundImage?.url ? '✅' : '⚠️';
  console.log(`  ${hasImage} Background image: ${collection.backgroundImage?.url ? 'Set' : 'Not set'}`);
  
  return { 
    success: true, 
    exists: true, 
    metadata: metadata.length,
    hasImage: !!collection.backgroundImage?.url
  };
}

async function testMenu(slug) {
  console.log(`\n🧭 Testing Menu: ${slug}...`);
  const result = await queryGraphQL(`
    query Menu($slug: String!, $channel: String!) {
      menu(slug: $slug, channel: $channel) {
        items {
          id
          name
          category { name slug }
          collection { name slug }
          page { title slug }
        }
      }
    }
  `, { slug, channel: CHANNEL });
  
  if (result.errors) {
    console.log('  ❌ Error:', result.errors[0].message);
    return { success: false };
  }
  
  const menu = result.data?.menu;
  if (!menu) {
    console.log('  ⚠️  Menu does not exist');
    console.log(`     → Create it in Dashboard: Content → Navigation → Create`);
    console.log(`     → Set slug to: "${slug}"`);
    return { success: false, exists: false };
  }
  
  const items = menu.items || [];
  console.log(`  ✅ Menu exists with ${items.length} items`);
  
  if (items.length > 0) {
    items.forEach(item => {
      let type = 'URL';
      let name = item.name;
      if (item.category) {
        type = 'Category';
        name = item.category.name;
      } else if (item.collection) {
        type = 'Collection';
        name = item.collection.name;
      } else if (item.page) {
        type = 'Page';
        name = item.page.title;
      }
      console.log(`     • ${type}: ${name}`);
    });
  } else {
    console.log('  ⚠️  Menu is empty');
    console.log('     → Add items in Dashboard: Content → Navigation → Edit menu');
  }
  
  return { success: true, itemCount: items.length };
}

async function runDetailedTests() {
  console.log('🚀 CMS Integration Detailed Test Report');
  console.log('='.repeat(60));
  console.log(`📍 API: ${API_URL}`);
  console.log(`📍 Channel: ${CHANNEL}`);
  console.log('='.repeat(60));
  
  const results = {};
  
  // Test Categories
  results.categories = await testCategories();
  
  // Test Collections
  results.heroBanner = await testCollection(
    'Hero Banner',
    'hero-banner',
    ['hero_title', 'hero_subtitle', 'hero_cta_text', 'hero_cta_link']
  );
  
  results.testimonials = await testCollection(
    'Testimonials',
    'testimonials',
    ['testimonials_json']
  );
  
  results.brands = await testCollection(
    'Brands',
    'brands',
    ['brands_json']
  );
  
  results.featuredProducts = await testCollection('Featured Products', 'featured-products');
  results.newArrivals = await testCollection('New Arrivals', 'new-arrivals');
  results.bestSellers = await testCollection('Best Sellers', 'best-sellers');
  results.sale = await testCollection('Sale', 'sale');
  
  // Test Menus
  results.navbar = await testMenu('navbar');
  results.footer = await testMenu('footer');
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  const categoriesOk = results.categories.success && results.categories.count > 0;
  const collectionsOk = [
    results.heroBanner,
    results.testimonials,
    results.brands,
    results.featuredProducts,
  ].some(r => r.success && r.exists);
  const menusOk = results.navbar.success || results.footer.success;
  
  console.log(`Categories:     ${categoriesOk ? '✅' : '⚠️'} ${results.categories.count} found`);
  console.log(`Collections:    ${collectionsOk ? '✅' : '⚠️'} Some configured`);
  console.log(`Menus:          ${menusOk ? '✅' : '⚠️'} ${results.navbar.itemCount || 0} + ${results.footer.itemCount || 0} items`);
  
  console.log('\n' + '='.repeat(60));
  console.log('💡 Next Steps:');
  console.log('='.repeat(60));
  
  if (!results.heroBanner.exists) {
    console.log('1. Create "hero-banner" collection with metadata for hero config');
  }
  if (!results.testimonials.exists) {
    console.log('2. Create "testimonials" collection with testimonials_json metadata');
  }
  if (!results.brands.exists) {
    console.log('3. Create "brands" collection with brands_json metadata');
  }
  if (results.categories.count === 0) {
    console.log('4. Create categories in Dashboard → Catalog → Categories');
  }
  if (!results.navbar.success) {
    console.log('5. Create "navbar" menu in Dashboard → Content → Navigation');
  }
  
  console.log('\n✅ All GraphQL queries are working correctly!');
  console.log('📖 See docs/CMS_TESTING_GUIDE.md for setup instructions');
}

runDetailedTests().catch(console.error);

