# Script to help get the App Token from Saleor
# This script provides GraphQL queries to create/get the app token

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Saleor App Token Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Option 1: Create App via GraphQL Playground" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:8000/graphql/" -ForegroundColor White
Write-Host "2. Run this mutation:" -ForegroundColor White
Write-Host ""
Write-Host "mutation {" -ForegroundColor Cyan
Write-Host "  appCreate(" -ForegroundColor Cyan
Write-Host "    input: {" -ForegroundColor Cyan
Write-Host "      name: `"Stripe`"" -ForegroundColor Cyan
Write-Host "      type: THIRDPARTY" -ForegroundColor Cyan
Write-Host "    }" -ForegroundColor Cyan
Write-Host "  ) {" -ForegroundColor Cyan
Write-Host "    app {" -ForegroundColor Cyan
Write-Host "      id" -ForegroundColor Cyan
Write-Host "      name" -ForegroundColor Cyan
Write-Host "      accessToken" -ForegroundColor Cyan
Write-Host "    }" -ForegroundColor Cyan
Write-Host "    errors {" -ForegroundColor Cyan
Write-Host "      field" -ForegroundColor Cyan
Write-Host "      message" -ForegroundColor Cyan
Write-Host "    }" -ForegroundColor Cyan
Write-Host "  }" -ForegroundColor Cyan
Write-Host "}" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Copy the 'accessToken' value" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Create App via Dashboard" -ForegroundColor Yellow
Write-Host "1. Open: http://localhost:9000" -ForegroundColor White
Write-Host "2. Go to: Apps -> Create App" -ForegroundColor White
Write-Host "3. Name: 'Stripe'" -ForegroundColor White
Write-Host "4. Copy the App Token" -ForegroundColor White
Write-Host ""

Write-Host "After getting the token, add it to:" -ForegroundColor Yellow
Write-Host "- infra/docker-compose.dev.yml (STRIPE_APP_TOKEN)" -ForegroundColor White
Write-Host "- Or create a .env file with STRIPE_APP_TOKEN=your_token" -ForegroundColor White

