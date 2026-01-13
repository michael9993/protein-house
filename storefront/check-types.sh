#!/bin/sh
# Quick TypeScript type checking before build
# Usage: ./check-types.sh

echo "🔍 Running TypeScript type check..."
pnpm exec tsc --noEmit 2>&1 | grep -E "error TS|\.tsx?:" | head -50
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ No type errors found!"
else
  echo "❌ Type errors found. Fix them before building."
fi

exit $EXIT_CODE

