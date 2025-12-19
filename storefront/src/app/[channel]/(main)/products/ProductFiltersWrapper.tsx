"use client";

import { useState, useEffect } from "react";
import { ProductFilters, MobileFilterDrawer } from "@/ui/components/Filters/ProductFilters";
import { storeConfig } from "@/config";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
  children?: Category[];
}

interface RawCategory {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  productCount: number;
}

interface ProductFiltersWrapperProps {
  channel: string;
  selectedCategories?: string[];
  mobileOnly?: boolean;
  categories?: Category[];
}

// Build category tree from flat list
function buildCategoryTree(flatCategories: RawCategory[]): Category[] {
  const categoryMap = new Map<string, Category>();
  const rootCategories: Category[] = [];

  // First pass: create all category objects
  flatCategories.forEach(cat => {
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      productCount: cat.productCount || 0,
      children: [],
    });
  });

  // Second pass: build tree structure based on parentId
  flatCategories.forEach(cat => {
    const category = categoryMap.get(cat.id)!;
    
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(category);
      } else {
        // Parent not found, treat as root (shouldn't happen normally)
        rootCategories.push(category);
      }
    } else {
      // No parent = root category
      rootCategories.push(category);
    }
  });

  // Debug: log the tree structure
  console.log("Category tree built:", rootCategories.map(c => ({
    name: c.name,
    slug: c.slug,
    childCount: c.children?.length || 0,
    children: c.children?.map(ch => ({ name: ch.name, slug: ch.slug }))
  })));

  return rootCategories;
}

export function ProductFiltersWrapper({ 
  channel, 
  selectedCategories = [],
  mobileOnly = false,
  categories: initialCategories,
}: ProductFiltersWrapperProps) {
  const { branding } = storeConfig;
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [loading, setLoading] = useState(!initialCategories);

  // Fetch ALL categories from API
  useEffect(() => {
    if (initialCategories) return;
    
    const fetchCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
        if (!apiUrl) {
          console.warn("NEXT_PUBLIC_SALEOR_API_URL not set");
          setLoading(false);
          return;
        }

        // Fetch all categories to get complete hierarchy
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query AllCategoriesForFilter($first: Int!, $channel: String!) {
                categories(first: $first) {
                  edges {
                    node {
                      id
                      name
                      slug
                      level
                      parent {
                        id
                      }
                      products(first: 1, channel: $channel) {
                        totalCount
                      }
                      children(first: 50) {
                        edges {
                          node {
                            id
                            name
                            slug
                            products(first: 1, channel: $channel) {
                              totalCount
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `,
            variables: { first: 100, channel },
          }),
        });

        const { data } = await response.json();
        
        if (data?.categories?.edges) {
          // Method 1: Use the children directly from API response for more reliable tree
          const categoriesFromApi = data.categories.edges;
          

          // Build tree using the children relation from API
          const rootCategories: Category[] = [];
          const processedIds = new Set<string>();

          // First, find all root categories (level 0 or no parent)
          categoriesFromApi.forEach((edge: any) => {
            const node = edge.node;
            if (node.level === 0 || !node.parent) {
              const category: Category = {
                id: node.id,
                name: node.name,
                slug: node.slug,
                productCount: node.products?.totalCount || 0,
                children: [],
              };

              // Add children from the API response
              if (node.children?.edges && node.children.edges.length > 0) {
                category.children = node.children.edges.map((childEdge: any) => {
                  processedIds.add(childEdge.node.id);
                  return {
                    id: childEdge.node.id,
                    name: childEdge.node.name,
                    slug: childEdge.node.slug,
                    productCount: childEdge.node.products?.totalCount || 0,
                    children: [],
                  };
                });
              }

              rootCategories.push(category);
              processedIds.add(node.id);
            }
          });


          setCategories(rootCategories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [channel, initialCategories]);

  // Mobile-only renders just the button
  if (mobileOnly) {
    return (
      <>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {selectedCategories.length > 0 && (
            <span 
              className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: branding.colors.primary }}
            >
              {selectedCategories.length}
            </span>
          )}
        </button>

        <MobileFilterDrawer 
          isOpen={mobileFiltersOpen} 
          onClose={() => setMobileFiltersOpen(false)}
        >
          <ProductFilters 
            categories={categories}
            selectedCategoryIds={selectedCategories}
          />
        </MobileFilterDrawer>
      </>
    );
  }

  // Desktop sidebar
  if (loading) {
    return (
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-20 rounded bg-neutral-200" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-4 rounded bg-neutral-200" />
                <div className="h-4 w-24 rounded bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <ProductFilters 
        categories={categories}
        selectedCategoryIds={selectedCategories}
      />
    </div>
  );
}
