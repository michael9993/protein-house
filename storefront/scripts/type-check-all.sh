#!/bin/sh
# Quick type check script - shows all errors at once
# Usage: ./scripts/type-check-all.sh
# Or from Docker: docker exec saleor-storefront-dev pnpm run type-check

echo "🔍 Running TypeScript type check..."
echo "This will show ALL type errors at once."
echo ""

pnpm run type-check

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ All type checks passed! Ready to build."
else
  echo ""
  echo "❌ Type check failed. Fix the errors above before building."
  echo ""
  echo "💡 Tips:"
  echo "  - Run 'pnpm run type-check' to see detailed errors"
  echo "  - Or check Docker logs: docker logs saleor-storefront-dev --tail 100"
fi

exit $EXIT_CODE

