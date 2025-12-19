/**
 * CMS Integration Test Script
 * 
 * Tests all CMS features by making GraphQL queries
 * Run: node test-cms.js
 */

const API_URL = process.env.SALEOR_API_URL || 'http://localhost:8000/graphql/';
const CHANNEL = process.env.CHANNEL || 'default-channel';

// Test queries
const queries = {
  categories: {
    query: `
      query CategoriesForHomepage($channel: String!, $first: Int = 8) {
        categories(first: $first, level: 0) {
          edges {
            node {
              id
              name
              slug
              description
              backgroundImage {
                url
                alt
              }
              products(channel: $channel, first: 1) {
                totalCount
              }
              metadata {
                key
                value
              }
            }
          }
        }
      }
    `,
    variables: { channel: CHANNEL, first: 8 }
  },
  
  heroBanner: {
    query: `
      query CollectionWithMetadata($slug: String!, $channel: String!) {
        collection(slug: $slug, channel: $channel) {
          id
          name
          slug
          backgroundImage {
            url
            alt
          }
          metadata {
            key
            value
          }
        }
      }
    `,
    variables: { slug: 'hero-banner', channel: CHANNEL }
  },
  
  testimonials: {
    query: `
      query CollectionWithMetadata($slug: String!, $channel: String!) {
        collection(slug: $slug, channel: $channel) {
          id
          name
          metadata {
            key
            value
          }
        }
      }
    `,
    variables: { slug: 'testimonials', channel: CHANNEL }
  },
  
  brands: {
    query: `
      query CollectionWithMetadata($slug: String!, $channel: String!) {
        collection(slug: $slug, channel: $channel) {
          id
          name
          metadata {
            key
            value
          }
        }
      }
    `,
    variables: { slug: 'brands', channel: CHANNEL }
  },
  
  featuredProducts: {
    query: `
      query ProductListByCollection($slug: String!, $channel: String!) {
        collection(slug: $slug, channel: $channel) {
          id
          name
          products(first: 10) {
            totalCount
            edges {
              node {
                id
                name
                slug
              }
            }
          }
        }
      }
    `,
    variables: { slug: 'featured-products', channel: CHANNEL }
  },
  
  menu: {
    query: `
      query MenuGetBySlug($slug: String!, $channel: String!) {
        menu(slug: $slug, channel: $channel) {
          items {
            id
            name
            category {
              id
              name
              slug
            }
            collection {
              id
              name
              slug
            }
            page {
              id
              title
              slug
            }
          }
        }
      }
    `,
    variables: { slug: 'navbar', channel: CHANNEL }
  }
};

async function testQuery(name, queryData) {
  try {
    console.log(`\n🧪 Testing: ${name}...`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: queryData.query,
        variables: queryData.variables,
      }),
    });
    
    const result = await response.json();
    
    if (result.errors) {
      console.log(`❌ Error: ${result.errors[0].message}`);
      return false;
    }
    
    if (result.data) {
      console.log(`✅ Success!`);
      
      // Pretty print results
      const data = result.data;
      if (data.categories) {
        const count = data.categories.edges?.length || 0;
        console.log(`   Found ${count} categories`);
        if (count > 0) {
          console.log(`   First category: ${data.categories.edges[0].node.name}`);
        }
      }
      if (data.collection) {
        console.log(`   Collection: ${data.collection.name || 'Not found'}`);
        if (data.collection.metadata) {
          const metaCount = data.collection.metadata.length;
          console.log(`   Metadata fields: ${metaCount}`);
        }
      }
      if (data.menu) {
        const itemCount = data.menu.items?.length || 0;
        console.log(`   Menu items: ${itemCount}`);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting CMS Integration Tests');
  console.log(`📍 API: ${API_URL}`);
  console.log(`📍 Channel: ${CHANNEL}`);
  console.log('='.repeat(50));
  
  const results = {};
  
  // Run all tests
  for (const [name, queryData] of Object.entries(queries)) {
    results[name] = await testQuery(name, queryData);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  for (const [name, passed] of Object.entries(results)) {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed}/${total} tests passed`);
  console.log('='.repeat(50));
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check Dashboard setup.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);

