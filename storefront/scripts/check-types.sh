#!/bin/sh
# Type check script that shows all errors at once
# Usage: ./scripts/check-types.sh

echo "🔍 Running TypeScript type check..."
echo ""

# Run type check and capture output
pnpm run type-check 2>&1 | tee /tmp/type-check-output.txt

# Check exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Type check passed! No errors found."
  exit 0
else
  echo ""
  echo "❌ Type check failed with $EXIT_CODE errors."
  echo ""
  echo "📋 Summary of errors:"
  echo "===================="
  # Extract just the error lines
  grep -E "Type error|error TS" /tmp/type-check-output.txt | head -20
  echo ""
  echo "💡 Tip: Run 'pnpm run type-check' to see all errors"
  exit $EXIT_CODE
fi

