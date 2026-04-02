# Testing Patterns

**Analysis Date:** 2026-02-15

## Test Framework

**Python Backend (saleor/):**
- **Runner**: Pytest 8.3.2+
- **Config**: `pyproject.toml` with `[tool.pytest]` section
- **Key plugins**:
  - `pytest-django==4.11.1` — Django integration, database setup
  - `pytest-asyncio` — Async test support
  - `pytest-celery` — Celery task testing
  - `pytest-cov` — Coverage reporting
  - `pytest-mock` — `monkeypatch` and `mocker` fixtures
  - `pytest-recording` — VCR-based HTTP mocking
  - `pytest-socket` — Prevent unintended network calls
  - `pytest-xdist` — Parallel test execution
  - `freezegun` — Time mocking
  - `fakeredis` — Redis mocking
- **Run Commands**:
```bash
docker exec -it aura-api-dev pytest --reuse-db                # All tests with DB reuse
docker exec -it aura-api-dev pytest --reuse-db path/test.py   # Single file
docker exec -it aura-api-dev pytest --reuse-db -k test_name   # Specific test
docker exec -it aura-api-dev pytest --cov=saleor --cov-report=html  # Coverage HTML
```

**Dashboard (dashboard/):**
- **Runner**: Jest (legacy, migrating to Vitest)
- **Config**: `jest.config.js`
- **Transformer**: SWC (`@swc/jest`) for TypeScript
- **Environment**: `jest-environment-jsdom` (browser simulation)
- **Setup**:
  - `jest-canvas-mock` — Canvas API mocking
  - `jest-localstorage-mock` — localStorage mocking
  - `testUtils/setup.ts` — Global test setup
- **Run Commands**:
```bash
docker exec -it aura-dashboard-dev pnpm test           # Watch mode
docker exec -it aura-dashboard-dev pnpm test:ci        # Single run for CI
```

**Apps Monorepo:**
- **Runner**: Vitest (configured per app and shared packages)
- **Config**: `vitest.config.ts` at app and package level
- **Workspaces**: Each app defines unit (`units`) and E2E (`e2e`) workspaces
- **Run Commands**:
```bash
docker exec -it aura-avatax-app-dev pnpm test           # Watch mode all tests
docker exec -it aura-avatax-app-dev pnpm test:ci        # Single run CI
docker exec -it aura-avatax-app-dev pnpm test --project units  # Unit tests only
docker exec -it aura-avatax-app-dev pnpm test --project e2e    # E2E tests only
```

**Storefront (storefront/):**
- **No test runner** — TypeScript strict mode and ESLint provide static analysis
- **Type safety**: Relies on `pnpm type-check` and `tsc --noEmit`

## Test File Organization

**Location Patterns:**
- **Python**: `saleor/[module]/tests/test_*.py` (tests in module subdirectories)
  - Example: `saleor/account/tests/test_account.py`, `saleor/account/tests/test_notifications.py`
  - Fixtures: `conftest.py` in test directories and module roots
- **TypeScript (Dashboard)**: Colocated with source, `.test.tsx` or `.test.ts` suffix
  - Example: `src/attributes/components/AttributeValueEditDialog/utils.test.ts`
  - Setup: `testUtils/` directory with global config and utilities
- **TypeScript (Apps)**: Colocated with source, `.test.ts` suffix for unit tests
  - Example: `src/lib/app-config.test.ts`
  - E2E tests: `e2e/**/*.spec.ts` separate directory
- **TypeScript (Storefront)**: No local tests; relies on Next.js build and type checking

**Naming:**
- **Python**: `test_[module_name].py` or `test_[function_name].py`
- **TypeScript**: `*.test.ts`, `*.test.tsx` (Jest/Vitest standard)
- **E2E**: `*.spec.ts` (Vitest workspace convention)

## Test Structure

**Python Fixture Pattern (from conftest.py):**
```python
# conftest.py defines pytest plugins for each domain
pytest_plugins = [
    "saleor.tests.fixtures",
    "saleor.account.tests.fixtures",
    "saleor.product.tests.fixtures",
    # ... 20+ fixture modules
]

# Fixtures are reusable test data/setup functions
# Usage in test:
def test_address_form_for_country(country):
    # given
    data = { "first_name": "John", "last_name": "Doe", "country": country }

    # when
    form = forms.get_address_form(data, country_code=country)
    errors = form.errors

    # then
    assert "street_address_1" in errors if "street_address" in required else True
```

**TypeScript Vitest Structure (from avatax app-config.test.ts):**
```typescript
import { describe, expect, it } from "vitest";
import { AppConfig } from "./app-config";

describe("AppConfig", () => {
  describe("getConfigForChannelSlug", () => {
    it("returns InvalidChannelSlugError if provided slug is not available", () => {
      // Arrange
      const config = AppConfig.createFromParsedConfig({
        channels: [],
        providerConnections: [],
      });

      // Act
      const result = config.getConfigForChannelSlug("default-channel");

      // Assert
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppConfig.InvalidChannelSlugError);
      expect(result._unsafeUnwrapErr()).toMatchObject({
        channelSlug: "default-channel",
      });
    });
  });
});
```

**TypeScript Jest Structure (Dashboard, from utils.test.ts):**
```typescript
import { AttributeValueEditDialogFormData } from "@dashboard/attributes/utils/data";
import { getAttributeValueFields } from "./utils";

describe("getAttributeValueFields", () => {
  it("should return fileUrl and contentType if attributeValue has fileUrl", () => {
    // Arrange
    const attributeValue = {
      fileUrl: "fileUrl",
      contentType: "contentType",
      value: "value",
    } as AttributeValueEditDialogFormData;
    const isSwatch = true;

    // Act
    const result = getAttributeValueFields(attributeValue, isSwatch);

    // Assert
    expect(result).toEqual({
      fileUrl: "fileUrl",
      contentType: "contentType",
    });
  });
});
```

## Patterns

**Python Setup/Teardown:**
- Fixtures provide setup (database, Redis, Celery)
- Django `TransactionTestCase` and `TestCase` handle DB cleanup automatically
- No explicit `tearDown()` needed; pytest handles with fixtures
- Example setup: `prepare_test_db_connections()` in `conftest.py` sets up replica DB

**TypeScript Setup/Teardown:**
- Jest: `setupFilesAfterEnv` in jest.config.js loads `testUtils/setup.ts`
- Vitest: `setupFiles` in vitest.config.ts loads setup modules
- App example (avatax): `setupFiles: "./src/setup-tests.ts"`
- E2E example: `setupFiles: ["./e2e/setup.ts"]` with `testTimeout: 63_000` (21s per request × 3 retries + buffer)

**Test Naming:**
- Python: `test_[what_is_being_tested]()`
  - Example: `test_address_form_for_country(country)`
  - Parametrized: `@pytest.mark.parametrize("country", ["CN", "PL", "US"])`
- TypeScript: `it("should [expected behavior]")`
  - Example: `it("should return fileUrl and contentType if attributeValue has fileUrl")`
  - Grouped: `describe("ComponentName")` or `describe("methodName")`

## Mocking

**Framework:**
- **Python**: `unittest.mock.patch()`, `pytest-mock.mocker`, `freezegun`, `fakeredis`, `pytest-recording`
- **TypeScript (Jest)**: Jest built-in mocking, `jest.mock()`, manual mocks in `__mocks__/` dirs
- **TypeScript (Vitest)**: Vitest mocking, `vi.mock()`, can use Jest-compatible mocks

**Patterns:**

**Python (from account/tests/test_account.py):**
```python
from unittest.mock import patch
import pytest
from freezegun import freeze_time

# Patch external dependencies
@patch("saleor.account.forms.get_address_form")
def test_with_mock(mock_form):
    mock_form.return_value.errors = {"street_address_1": ["Error"]}
    # Test code
    assert mock_form.called

# Use freezegun for time-based tests
@freeze_time("2024-01-01")
def test_with_time():
    assert timezone.now() == datetime(2024, 1, 1)

# Use fakeredis for Redis operations
def test_with_redis(monkeypatch, fakeredis):
    monkeypatch.setenv("REDIS_URL", fakeredis.build_url())
    # Redis operations tested without real Redis
```

**TypeScript (Vitest, from avatax tests):**
```typescript
import { describe, it, expect, vi } from "vitest";

describe("Service", () => {
  it("should call method with correct args", () => {
    // Manual mock setup
    const mockFn = vi.fn().mockReturnValue({ success: true });
    const service = new Service(mockFn);

    service.execute();

    expect(mockFn).toHaveBeenCalledWith(expectedArgs);
  });

  it("should handle error with neverthrow", () => {
    const result = service.doSomething();

    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toBeInstanceOf(ExpectedError);
  });
});
```

**What to Mock:**
- External APIs (HTTP, webhooks, payment providers)
- Database queries (return fixtures instead)
- Time-dependent logic (freeze time)
- File I/O (mock filesystem)
- Redis/cache operations

**What NOT to Mock:**
- Core business logic (test the actual implementation)
- Error handling (test real error paths)
- Data transformations (test with real data)
- Type validation (test Zod schemas, Pydantic models with real data)

## Fixtures and Factories

**Python Fixture Pattern (saleor/tests/):**
```python
# conftest.py in module directories define fixtures
import pytest

@pytest.fixture
def user(db):
    """Create a test user"""
    return User.objects.create_user(
        email="test@example.com",
        password="testpass123"
    )

@pytest.fixture
def product(db, channel):
    """Create a test product with variants"""
    product = Product.objects.create(
        name="Test Product",
        slug="test-product"
    )
    ProductVariant.objects.create(
        product=product,
        channel=channel,
        sku="TEST-SKU"
    )
    return product

# Usage in tests
def test_add_to_cart(user, product):
    # Fixtures automatically injected
    cart = Cart.objects.create(user=user)
    # Test code
```

**TypeScript Mocks Location:**
- Dashboard: `src/__mocks__/` directory contains Jest mocks
  - Example: `__mocks__/react-intl.ts` for i18n testing
- Apps: `src/__tests__/mocks/` or inline mocks in tests
- Test data: Factory functions in `src/fixtures/` or inline in test files

**Fixture Example (TypeScript):**
```typescript
// avatax E2E uses test data templates
const testData = {
  "@DATA:TEMPLATE@": "Checkout:PricesWithTax",
  "@OVERRIDES@": {
    lines: [{ quantity: 10, variantId: "$M{Product.Juice.variantId}" }],
    channelSlug: "$M{Channel.PricesWithTax.slug}",
  },
};
// PactumJS interpolates test data at runtime
```

**Location:**
- Python: `saleor/[module]/tests/fixtures/` or inline in `conftest.py`
- TypeScript: Inline in test files or `src/fixtures/` directories

## Coverage

**Requirements:**
- **Python (saleor/)**: Coverage tracked, no enforced minimum (see `pytest-cov`)
  - Run: `docker exec aura-api-dev pytest --cov=saleor --cov-report=html`
  - Reports: HTML coverage report in `htmlcov/index.html`
- **Dashboard**: Coverage configured in `jest.config.js` but not enforced
  - Collect from: `collectCoverageFrom: ["<rootDir>/src/**/*.{ts,tsx}"]`
- **Apps**: Coverage collected but not enforced (see `turbo.json` test:ci outputs)
  - Output: `coverage/**` directory
- **Storefront**: No coverage (no test runner)

**View Coverage:**
```bash
# Python (HTML report)
docker exec aura-api-dev pytest --cov=saleor --cov-report=html
# Open htmlcov/index.html in browser

# Apps (Vitest)
docker exec aura-avatax-app-dev pnpm test:ci --coverage
# HTML in coverage/ directory
```

## Test Types

**Unit Tests (All Frameworks):**
- **Scope**: Single function/method in isolation
- **Approach**: Mock all dependencies, test function logic only
- **Python example**: Test form validation without database queries
- **TypeScript example**: Test `AppConfig.getConfigForChannelSlug()` with mocked data
- **Location**: Colocated with source code (`*.test.ts` next to `*.ts`)

**Integration Tests:**
- **Python**:
  - Database integration: Use pytest-django fixtures for real DB access
  - Task execution: `pytest-celery` for testing Celery tasks with broker
  - GraphQL mutations: Test full schema with mock data
  - Example: `test_address_form_for_country()` validates with real form logic
- **TypeScript (Apps)**:
  - Module interaction: Test how modules interact (e.g., AppConfig + ChannelConfig)
  - GraphQL operations: Mock HTTP but test real operation parsing
  - Location: Still in `src/**/*.test.ts`, same as unit tests (distinction is in scope)
- **TypeScript (Dashboard/Storefront)**:
  - Component integration: Render components with providers, test user interactions
  - Apollo Client queries: Mock GraphQL API, test component query logic

**E2E Tests:**
- **Python (saleor/)**: Not common; database tests serve this purpose
- **TypeScript (Apps)**:
  - Scope: Full app workflow with real Saleor API
  - Framework: Vitest workspace `e2e` with PactumJS
  - Example (avatax): `checkout-basic-product-with-tax-code.spec.ts`
    - Creates checkout → adds delivery method → calculates taxes
    - Uses templates and data interpolation via PactumJS
  - Location: `e2e/**/*.spec.ts`
  - Timeout: 63 seconds (accounts for 21s request timeout × 3 retries + buffer)
  - Run: `docker exec aura-avatax-app-dev pnpm test --project e2e`
- **Dashboard**: Playwright E2E tests (separate from Jest)
  - Run: `docker exec aura-dashboard-dev pnpm e2e`
  - Location: `playwright/` directory (not visible in codebase read)

## Async Testing

**Python:**
```python
import pytest
from django.test import AsyncClient

@pytest.mark.asyncio
async def test_async_endpoint():
    client = AsyncClient()
    response = await client.get("/api/endpoint/")
    assert response.status_code == 200

# Celery tasks
def test_celery_task(mocker):
    mock_send = mocker.patch("saleor.account.tasks.send_password_reset_notification")
    trigger_send_password_reset_notification(user_pk=1, ...)
    mock_send.assert_called_once()
```

**TypeScript (Vitest):**
```typescript
import { describe, it, expect } from "vitest";

describe("Async Function", () => {
  it("should resolve with data", async () => {
    const result = await asyncFunction();
    expect(result).toEqual(expectedValue);
  });

  it("should handle rejection", async () => {
    await expect(asyncFunction()).rejects.toThrow(ExpectedError);
  });
});
```

## Error Testing

**Python:**
```python
import pytest
from django.core.exceptions import ValidationError

def test_validation_error():
    with pytest.raises(ValidationError) as exc_info:
        form.full_clean()  # Raises ValidationError

    assert "field_name" in exc_info.value.message_dict

# With fixture
@pytest.fixture
def invalid_address_data():
    return {"country": "PL", "postal_code": "XXX"}  # Invalid for PL

def test_invalid_postal_code(invalid_address_data):
    form = forms.get_address_form(invalid_address_data, country_code="PL")
    assert "postal_code" in form.errors
```

**TypeScript (neverthrow):**
```typescript
import { describe, it, expect } from "vitest";
import { AppConfig } from "./app-config";

it("returns error result when channel not found", () => {
  const config = AppConfig.createFromParsedConfig({
    channels: [],
    providerConnections: [],
  });

  const result = config.getConfigForChannelSlug("invalid-channel");

  // Extract and assert error
  expect(result.isErr()).toBe(true);
  const err = result._unsafeUnwrapErr();
  expect(err).toBeInstanceOf(AppConfig.InvalidChannelSlugError);
  expect(err.props.channelSlug).toBe("invalid-channel");
});
```

---

*Testing analysis: 2026-02-15*
