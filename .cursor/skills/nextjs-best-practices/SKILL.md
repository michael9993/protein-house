---
name: nextjs-best-practices
description: Produces optimized, maintainable Next.js code following best practices for performance, security, and architecture. Use when building Next.js applications, React components, implementing SSR/SSG, optimizing performance, or when the user asks about Next.js patterns, React Server Components, or modern React/Next.js development.
---

# Next.js Best Practices

Expert guidance for creating optimized, maintainable Next.js applications with TypeScript, React, and modern UI frameworks.

## Core Principles

### Code Style and Structure
- Write concise, technical TypeScript with accurate examples
- Use functional and declarative patterns; avoid classes
- Favor iteration and modularization over duplication
- Use descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)
- Structure files: exported components → subcomponents → helpers → static content → types
- Use lowercase with dashes for directory names (`components/auth-wizard`)

### React Server Components (RSC) Priority
- **Minimize** `'use client'`, `useEffect`, and `setState`
- **Favor** React Server Components and Next.js SSR features
- Use Server Components by default; add `'use client'` only when needed (interactivity, hooks, browser APIs)
- Leverage Server Actions for mutations instead of API routes when possible

### Performance Optimization
- Implement dynamic imports for code splitting: `next/dynamic` with `loading` states
- Use responsive design with mobile-first approach
- Optimize images:
  - Use WebP format when possible
  - Include size data (`width`, `height`, or `fill`)
  - Implement lazy loading (`loading="lazy"`)
  - Use `next/image` component

### Error Handling and Validation
- Use early returns for error conditions
- Implement guard clauses for preconditions and invalid states
- Use custom error types for consistent error handling
- Validate user input with Zod schemas

### UI and Styling
- Use modern UI frameworks: Tailwind CSS, Shadcn UI, Radix UI
- Implement consistent design and responsive patterns
- Follow mobile-first responsive design principles

### State Management and Data Fetching
- Use modern solutions:
  - **Global state**: Zustand, Jotai, or React Context (when appropriate)
  - **Server state**: TanStack React Query (React Query) for client-side data fetching
- Implement validation using Zod for schema validation
- Prefer Server Components for data fetching when possible

### Security and Performance
- Implement proper error handling and user input validation
- Follow secure coding practices (sanitize inputs, use parameterized queries, etc.)
- Reduce load times: code splitting, lazy loading, image optimization
- Improve rendering efficiency: memoization, virtualization for long lists

### Testing and Documentation
- Write unit tests with Jest and React Testing Library
- Provide clear comments for complex logic
- Use JSDoc comments for functions and components

## Development Methodology

### Process
1. **Deep Dive Analysis**: Thoroughly analyze requirements and constraints
2. **Planning**: Develop clear architectural structure and flow
3. **Implementation**: Step-by-step implementation following best practices
4. **Review and Optimize**: Review for optimization opportunities
5. **Finalization**: Ensure requirements met, secure, and performant

### Thinking Approach
- **System 2 Thinking**: Analytical rigor, break down into manageable parts
- **Tree of Thoughts**: Evaluate multiple solutions and consequences
- **Iterative Refinement**: Consider improvements, edge cases, optimizations before finalizing

## Common Patterns

### Server Component Example
```tsx
// app/products/page.tsx (Server Component by default)
import { getProducts } from '@/lib/data';

export default async function ProductsPage() {
  const products = await getProducts();
  
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Client Component Example
```tsx
// components/product-interactions.tsx
'use client';

import { useState } from 'react';

export function ProductInteractions({ productId }: { productId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Client-side interactivity
  return <button onClick={handleClick}>Add to Cart</button>;
}
```

### Dynamic Import Example
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false, // Only if component requires browser-only APIs
});
```

### Error Handling Pattern
```tsx
export async function getData() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    // Handle error appropriately
    throw error;
  }
}
```

### Zod Validation Example
```tsx
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  price: z.number().positive(),
});

type Product = z.infer<typeof ProductSchema>;
```

## Anti-Patterns to Avoid

- ❌ Overusing `'use client'` when Server Components suffice
- ❌ Fetching data in `useEffect` when Server Components can fetch directly
- ❌ Unoptimized images (missing sizes, no lazy loading)
- ❌ Missing error boundaries and error handling
- ❌ Inconsistent naming conventions
- ❌ Deeply nested components without extraction
- ❌ Missing TypeScript types or using `any` unnecessarily
